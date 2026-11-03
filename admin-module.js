// ==========================================
// 🛡️ DYNAMIC ADMIN MODULE (แยกเพื่อความปลอดภัยและความเร็วสูงสุด)
// โหลดเฉพาะเมื่อแอดมินยืนยันรหัสผ่านสำเร็จเท่านั้น
// ==========================================

(function(window) {
  const { useState, useEffect, useMemo, useCallback, useRef } = window.React || React;
  const _Fragment = window._Fragment || (window.React && window.React.Fragment);
  const _jsx = window._jsx || function(type, props, key) { const p = Object.assign({}, props); if (key !== undefined) p.key = key; const children = p.children; delete p.children; if (children === undefined) return React.createElement(type, p); if (Array.isArray(children)) return React.createElement(type, p, ...children); return React.createElement(type, p, children); };
  const _jsxs = window._jsxs || _jsx;
  const Icon = window.Icon || {};
  const dbAssembly = window.dbAssembly;
  const dbReCheckFallback = window.dbReCheckFallback;
  const generateDailyLineReport = window.generateDailyLineReport;
  const calculateSchoolDaysStats = window.calculateSchoolDaysStats;
  const fetchAllRows = window.fetchAllRows;
  const CANONICAL_DEPTS = window.CANONICAL_DEPTS;
  const DEFAULT_PIN_HASH = window.DEFAULT_PIN_HASH;
  const DEFAULT_DEPT_CODES = window.DEFAULT_DEPT_CODES;
  const extractClassLevel = window.extractClassLevel;
  const getDeptFromStudentId = window.getDeptFromStudentId;
  const normalizeDepartmentName = window.normalizeDepartmentName;
  const formatDeptDisplay = window.formatDeptDisplay;
  const normalizeTeacherName = window.normalizeTeacherName;
  const formatLocalDate = window.formatLocalDate;
  const formatThaiDateFull = window.formatThaiDateFull || ((d) => d);
  const safeCopyToClipboard = window.safeCopyToClipboard || ((t) => navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject());
  const InfoTooltip = window.InfoTooltip;
  const StudentPhotoInput = window.StudentPhotoInput;
  const hashPassword = window.hashPassword;

// ==========================================
// COMPONENT: การตั้งค่าและการส่งรายงานเข้า LINE กลุ่มครู
// ==========================================
function AdminLineSettingsTab({
  lineSettings = {},
  onSaveLineSettings,
  masterStudents = [],
  academicYear = '2569',
  semester = '1',
  sessions = []
}) {
  const [channelAccessToken, setChannelAccessToken] = useState(lineSettings.channelAccessToken || '');
  const [destinationId, setDestinationId] = useState(lineSettings.destinationId || '');
  const [dashboardUrl, setDashboardUrl] = useState(lineSettings.dashboardUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://attendance-dashboard.vercel.app'));
  const [customNote, setCustomNote] = useState(lineSettings.customNote || 'งานพัฒนากิจกรรมนักเรียนนักศึกษา วก.ด่านซ้าย');
  const [autoSendOnCutoff, setAutoSendOnCutoff] = useState(Boolean(lineSettings.autoSendOnCutoff));

  const [previewTab, setPreviewTab] = useState('flex'); // 'flex' | 'text' | 'json'
  const [useMockData, setUseMockData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copied, setCopied] = useState('');

  const reportData = useMemo(() => {
    return generateDailyLineReport({
      masterStudents,
      sessions,
      academicYear,
      semester,
      customNote,
      dashboardUrl,
      forceMock: useMockData
    });
  }, [masterStudents, sessions, academicYear, semester, customNote, dashboardUrl, useMockData]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const payload = {
        channelAccessToken: channelAccessToken.trim(),
        destinationId: destinationId.trim(),
        dashboardUrl: dashboardUrl.trim(),
        customNote: customNote.trim(),
        autoSendOnCutoff: Boolean(autoSendOnCutoff)
      };
      if (onSaveLineSettings) {
        await onSaveLineSettings(payload);
      }
      setSaveSuccessMsg('บันทึกการตั้งค่า LINE เรียบร้อยแล้ว');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      alert('บันทึกล้มเหลว: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportData.textMessage);
      } else {
        const ta = document.createElement('textarea');
        ta.value = reportData.textMessage;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied('text');
      setTimeout(() => setCopied(''), 2500);
    } catch (err) {
      alert('คัดลอกข้อความไม่สำเร็จ: ' + err.message);
    }
  };

  const handleCopyJson = async () => {
    try {
      const jsonStr = JSON.stringify(reportData.flexMessage, null, 2);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else {
        const ta = document.createElement('textarea');
        ta.value = jsonStr;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied('json');
      setTimeout(() => setCopied(''), 2500);
    } catch (err) {
      alert('คัดลอก JSON ไม่สำเร็จ: ' + err.message);
    }
  };

  const handleSendToLine = async (isTestPing = false) => {
    const hasMessagingApi = Boolean(channelAccessToken.trim() && destinationId.trim());

    if (!hasMessagingApi) {
      alert('กรุณากรอก LINE Channel Access Token และ Destination Group ID ก่อนสั่งส่งรายงาน');
      return;
    }

    if (!confirm(isTestPing ? 'ยืนยันการทดสอบส่งข้อความเชื่อมต่อไปยัง LINE?' : `ยืนยันการส่งรายงานสรุปยอดการเข้าแถวประจำวัน (${reportData.dateFormatted}) เข้ากลุ่ม LINE?`)) {
      return;
    }

    setIsSending(true);
    try {
      const endpoint = '/api/line-notify';
      const bodyPayload = {
        channelAccessToken: channelAccessToken.trim(),
        destinationId: destinationId.trim(),
        flexMessage: isTestPing ? null : reportData.flexMessage,
        textMessage: isTestPing 
          ? '🔔 [ทดสอบการเชื่อมต่อ] ระบบเช็คชื่อเข้าแถวดิจิทัล วก.ด่านซ้าย เชื่อมต่อกับระบบแจ้งเตือน LINE เรียบร้อยแล้ว' 
          : reportData.textMessage,
        altText: isTestPing 
          ? 'ทดสอบเชื่อมต่อระบบ LINE วก.ด่านซ้าย' 
          : `สรุปยอดการเข้าแถว วก.ด่านซ้าย ประจำ${reportData.dateFormatted}`
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        if (res.status === 404) {
          throw new Error('ไม่พบเซิร์ฟเวอร์ API สำหรับส่ง LINE (HTTP 404)\nโปรดรีสตาร์ตเซิร์ฟเวอร์โดยปิดหน้าต่าง CMD แล้วเปิดไฟล์ "เปิดระบบแดชบอร์ด.cmd" ใหม่อีกครั้ง');
        }
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      alert(isTestPing ? 'ส่งข้อความทดสอบสำเร็จ! โปรดตรวจสอบในแอป LINE' : 'ส่งรายงานเข้ากลุ่ม LINE เรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Send to LINE error:', err);
      alert('เกิดข้อผิดพลาดในการส่ง LINE: ' + (err.message || err) + '\n\nคำแนะนำ: คุณสามารถใช้ปุ่ม "คัดลอกข้อความสรุป" ไปวางในกลุ่ม LINE ได้ทันที');
    } finally {
      setIsSending(false);
    }
  };

  return /*#__PURE__*/_jsxs("div", {
    className: "p-4 sm:p-6 space-y-6 max-w-5xl mx-auto",
    children: [
      /* Header Banner */
      /*#__PURE__*/_jsxs("div", {
        className: "p-5 rounded-2xl bg-gradient-to-r from-[#3a050b] via-[#590b14] to-[#7a121e] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-900/60",
        children: [
          /*#__PURE__*/_jsxs("div", {
            className: "space-y-1",
            children: [
              /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  /*#__PURE__*/_jsx("span", { className: "text-xl", children: "📲" }),
                  /*#__PURE__*/_jsx("h3", { className: "text-base sm:text-lg font-bold tracking-tight text-white", children: "ตั้งค่าการรายงานผลเข้า LINE กลุ่มครู" })
                ]
              }),
              /*#__PURE__*/_jsx("p", {
                className: "text-xs text-rose-200/90 leading-relaxed max-w-2xl",
                children: "ระบบสรุปยอดการเข้าแถวประจำวัน พร้อมสถิติ 8 แผนกวิชา ส่งตรงเข้ากลุ่มครูและผู้บริหาร (ผอ.) ผ่าน LINE Flex Message หรือข้อความสรุปฉบับย่อ"
              })
            ]
          }),
          /*#__PURE__*/_jsxs("div", {
            className: "flex flex-wrap items-center gap-2 flex-shrink-0",
            children: [
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: handleCopyText,
                className: "px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                children: [
                  /*#__PURE__*/_jsx(Icon.Copy, { className: "w-3.5 h-3.5" }),
                  copied === 'text' ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความสรุป'
                ]
              }),
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: () => handleSendToLine(false),
                disabled: isSending,
                className: "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md",
                children: [
                  isSending ? /*#__PURE__*/_jsx(Icon.Spin, { className: "w-3.5 h-3.5" }) : /*#__PURE__*/_jsx(Icon.Send, { className: "w-3.5 h-3.5" }),
                  "ส่งเข้า LINE ตอนนี้"
                ]
              })
            ]
          })
        ]
      }),

      /* Main 2-column layout: Form vs Phone Preview */
      /*#__PURE__*/_jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",
        children: [
          /* Form Config Column (7 cols) */
          /*#__PURE__*/_jsxs("div", {
            className: "lg:col-span-7 space-y-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs",
            children: [
              /*#__PURE__*/_jsxs("div", {
                className: "border-b border-slate-100 pb-3 flex items-center justify-between",
                children: [
                  /*#__PURE__*/_jsxs("h4", {
                    className: "text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2",
                    children: [
                      /*#__PURE__*/_jsx(Icon.Gear, { className: "w-4 h-4 text-rose-800" }),
                      "ข้อมูลเชื่อมต่อ LINE API"
                    ]
                  }),
                  saveSuccessMsg && /*#__PURE__*/_jsxs("span", {
                    className: "text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in",
                    children: [/*#__PURE__*/_jsx(Icon.CheckCircle, { className: "w-3.5 h-3.5" }), saveSuccessMsg]
                  })
                ]
              }),

              /* Channel Access Token */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [
                  /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-800", children: "LINE Channel Access Token (Long-Lived)" }),
                      /*#__PURE__*/_jsx("span", { className: "text-[11px] text-slate-400 font-medium", children: "Messaging API (แนะนำ)" })
                    ]
                  }),
                  /*#__PURE__*/_jsx("input", {
                    type: "password",
                    value: channelAccessToken,
                    onChange: (e) => setChannelAccessToken(e.target.value),
                    placeholder: "ตัวอย่าง: eyJhbGciOiJIUzI1NiIs...",
                    className: "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-800 focus:ring-1 focus:ring-rose-800 text-xs font-mono bg-slate-50/50"
                  }),
                  /*#__PURE__*/_jsx("p", {
                    className: "text-[11px] text-slate-500",
                    children: "ได้จาก LINE Developers Console > Messaging API > Channel access token"
                  })
                ]
              }),

              /* Destination Group ID / User ID */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [
                  /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-800", children: "Destination Group ID / Chat ID" }),
                      /*#__PURE__*/_jsx("span", { className: "text-[11px] text-rose-700 font-bold", children: "ไอดีกลุ่มครู" })
                    ]
                  }),
                  /*#__PURE__*/_jsx("input", {
                    type: "text",
                    value: destinationId,
                    onChange: (e) => setDestinationId(e.target.value),
                    placeholder: "ตัวอย่าง: Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                    className: "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-800 focus:ring-1 focus:ring-rose-800 text-xs font-mono bg-slate-50/50"
                  }),
                  /*#__PURE__*/_jsx("p", {
                    className: "text-[11px] text-slate-500",
                    children: "ไอดีกลุ่ม LINE ของวิทยาลัย (ขึ้นต้นด้วย C...) บอทต้องได้รับเชิญเข้ากลุ่มนั้นด้วย"
                  })
                ]
              }),

              /* Dashboard URL */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [
                  /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-800", children: "ลิงก์หน้าแดชบอร์ดวิทยาลัย (สำหรับปุ่มบน Flex Card)" }),
                  /*#__PURE__*/_jsx("input", {
                    type: "url",
                    value: dashboardUrl,
                    onChange: (e) => setDashboardUrl(e.target.value),
                    placeholder: "https://...",
                    className: "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-800 focus:ring-1 focus:ring-rose-800 text-xs bg-slate-50/50"
                  })
                ]
              }),

              /* Custom Note */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [
                  /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-800", children: "ข้อความปิดท้ายรายงาน (Footer Note)" }),
                  /*#__PURE__*/_jsx("input", {
                    type: "text",
                    value: customNote,
                    onChange: (e) => setCustomNote(e.target.value),
                    placeholder: "ตัวอย่าง: งานพัฒนากิจกรรมนักเรียนนักศึกษา วก.ด่านซ้าย",
                    className: "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-800 focus:ring-1 focus:ring-rose-800 text-xs bg-slate-50/50"
                  })
                ]
              }),

              /* Switch: Auto Send on Cutoff */
              /*#__PURE__*/_jsx("div", {
                className: "pt-2 border-t border-slate-100",
                children: /*#__PURE__*/_jsxs("label", {
                  className: "flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors",
                  children: [
                    /*#__PURE__*/_jsx("input", {
                      type: "checkbox",
                      checked: autoSendOnCutoff,
                      onChange: (e) => setAutoSendOnCutoff(e.target.checked),
                      className: "mt-0.5 rounded text-rose-800 focus:ring-rose-800"
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "text-xs",
                      children: [
                        /*#__PURE__*/_jsx("span", { className: "font-bold text-slate-800 block", children: "ส่งรายงานอัตโนมัติเมื่อถึงเวลาตัดรอบ (08:20 น.)" }),
                        /*#__PURE__*/_jsx("span", { className: "text-slate-500 text-[11px]", children: "ระบบจะสรุปและส่งเข้า LINE กลุ่มครูอัตโนมัติเวลา 08:20 น. (เช็คตามปฏิทิน: ส่งเฉพาะวันเรียนปกติ ยกเว้นวันหยุดเสาร์-อาทิตย์และวันหยุดพิเศษ)" })
                      ]
                    })
                  ]
                })
              }),

              /* Save & Test Buttons */
              /*#__PURE__*/_jsxs("div", {
                className: "pt-3 flex flex-wrap gap-2.5",
                children: [
                  /*#__PURE__*/_jsxs("button", {
                    type: "button",
                    onClick: handleSave,
                    disabled: isSaving,
                    className: "flex-1 py-2.5 px-4 rounded-xl bg-[#590b14] hover:bg-[#43080e] disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2",
                    children: [
                      isSaving ? /*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4" }) : /*#__PURE__*/_jsx(Icon.Save, { className: "w-4 h-4" }),
                      "บันทึกการตั้งค่า LINE"
                    ]
                  }),
                  /*#__PURE__*/_jsxs("button", {
                    type: "button",
                    onClick: () => handleSendToLine(true),
                    disabled: isSending,
                    className: "py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-all flex items-center gap-1.5",
                    title: "ส่งข้อความสั้นเพื่อเช็คว่า Token เชื่อมต่อถูกต้องหรือไม่",
                    children: [
                      /*#__PURE__*/_jsx(Icon.Send, { className: "w-3.5 h-3.5" }),
                      "ทดสอบส่งเชื่อมต่อ"
                    ]
                  })
                ]
              })
            ]
          }),

          /* Smartphone Mockup Preview Column (5 cols) */
          /*#__PURE__*/_jsxs("div", {
            className: "lg:col-span-5 space-y-3",
            children: [
              /* Preview Controls */
              /*#__PURE__*/_jsxs("div", {
                className: "flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs",
                children: [
                  /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center gap-1",
                    children: [
                      /*#__PURE__*/_jsx("button", {
                        type: "button",
                        onClick: () => setPreviewTab('flex'),
                        className: `px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${previewTab === 'flex' ? 'bg-[#590b14] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`,
                        children: "Flex Card"
                      }),
                      /*#__PURE__*/_jsx("button", {
                        type: "button",
                        onClick: () => setPreviewTab('text'),
                        className: `px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${previewTab === 'text' ? 'bg-[#590b14] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`,
                        children: "Text"
                      }),
                      /*#__PURE__*/_jsx("button", {
                        type: "button",
                        onClick: () => setPreviewTab('json'),
                        className: `px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${previewTab === 'json' ? 'bg-[#590b14] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`,
                        children: "JSON"
                      })
                    ]
                  }),
                  /*#__PURE__*/_jsxs("label", {
                    className: "flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer",
                    children: [
                      /*#__PURE__*/_jsx("input", {
                        type: "checkbox",
                        checked: useMockData,
                        onChange: (e) => setUseMockData(e.target.checked),
                        className: "rounded text-rose-800"
                      }),
                      "จำลองยอดตัวอย่าง"
                    ]
                  })
                ]
              }),

              /* Smartphone Frame */
              /*#__PURE__*/_jsxs("div", {
                className: "mx-auto w-full max-w-[340px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 relative",
                children: [
                  /* Camera Notch */
                  /*#__PURE__*/_jsx("div", {
                    className: "w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center",
                    children: /*#__PURE__*/_jsx("div", { className: "w-2 h-2 rounded-full bg-slate-900" })
                  }),

                  /* Phone Screen Content */
                  /*#__PURE__*/_jsxs("div", {
                    className: "rounded-[28px] overflow-hidden border border-slate-800 flex flex-col h-[520px] bg-slate-100",
                    children: [
                      /* LINE Chat Header */
                      /*#__PURE__*/_jsxs("div", {
                        className: "bg-[#273238] text-white px-3.5 py-2.5 flex items-center justify-between flex-shrink-0 shadow-xs",
                        children: [
                          /*#__PURE__*/_jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [
                              /*#__PURE__*/_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400" }),
                              /*#__PURE__*/_jsxs("div", {
                                children: [
                                  /*#__PURE__*/_jsx("div", { className: "text-xs font-bold truncate max-w-[170px]", children: "วก.ด่านซ้าย (ผอ. & คณะครู)" }),
                                  /*#__PURE__*/_jsx("div", { className: "text-[9px] text-slate-300 font-mono", children: "Bot • Messaging API" })
                                ]
                              })
                            ]
                          }),
                          /*#__PURE__*/_jsx("span", { className: "text-[10px] text-slate-400 font-mono", children: "08:20" })
                        ]
                      }),

                      /* Chat Scroll Area */
                      /*#__PURE__*/_jsx("div", {
                        className: "p-2.5 overflow-y-auto flex-1 custom-scroll",
                        children: previewTab === 'flex' ? (
                          /* Render Visual Flex Bubble Preview */
                          /*#__PURE__*/_jsxs("div", {
                            className: "w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden",
                            children: [
                              /* Bubble Header */
                              /*#__PURE__*/_jsxs("div", {
                                className: "bg-[#590b14] text-white p-3.5 text-center relative",
                                children: [
                                  /*#__PURE__*/_jsx("div", { className: "text-[10px] uppercase font-bold tracking-wider text-rose-200", children: "วิทยาลัยการอาชีพด่านซ้าย" }),
                                  /*#__PURE__*/_jsx("div", { className: "text-sm font-bold text-white mt-0.5", children: "สรุปยอดการเข้าแถวประจำวัน" }),
                                  /*#__PURE__*/_jsxs("div", { className: "text-[10px] text-rose-300 mt-0.5", children: [reportData.dateFormatted, " • เทอม ", semester, "/", academicYear] })
                                ]
                              }),

                              /* Bubble Body */
                              /*#__PURE__*/_jsxs("div", {
                                className: "p-3 space-y-2.5",
                                children: [
                                  /* KPI Chips */
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "grid grid-cols-4 gap-1 p-2 bg-slate-50 rounded-xl text-center border border-slate-100",
                                    children: [
                                      /*#__PURE__*/_jsxs("div", {
                                        children: [
                                          /*#__PURE__*/_jsx("div", { className: "text-[9px] text-slate-500", children: "นักเรียน" }),
                                          /*#__PURE__*/_jsx("div", { className: "text-xs font-bold text-slate-900 font-mono", children: reportData.totalStudents }),
                                          /*#__PURE__*/_jsx("div", { className: "text-[8px] text-slate-400", children: "คน" })
                                        ]
                                      }),
                                      /*#__PURE__*/_jsxs("div", {
                                        children: [
                                          /*#__PURE__*/_jsx("div", { className: "text-[9px] text-emerald-600 font-bold", children: "มาแถว" }),
                                          /*#__PURE__*/_jsx("div", { className: "text-xs font-bold text-emerald-600 font-mono", children: reportData.totalPresent }),
                                          /*#__PURE__*/_jsx("div", { className: "text-[8px] text-emerald-500", children: "คน" })
                                        ]
                                      }),
                                      /*#__PURE__*/_jsxs("div", {
                                        children: [
                                          /*#__PURE__*/_jsx("div", { className: "text-[9px] text-rose-600 font-bold", children: "ขาด" }),
                                          /*#__PURE__*/_jsx("div", { className: "text-xs font-bold text-rose-600 font-mono", children: reportData.totalAbsent }),
                                          /*#__PURE__*/_jsx("div", { className: "text-[8px] text-rose-500", children: "คน" })
                                        ]
                                      }),
                                      /*#__PURE__*/_jsxs("div", {
                                        children: [
                                          /*#__PURE__*/_jsx("div", { className: "text-[9px] text-amber-600 font-bold", children: "ลา" }),
                                          /*#__PURE__*/_jsx("div", { className: "text-xs font-bold text-amber-600 font-mono", children: reportData.totalLeave }),
                                          /*#__PURE__*/_jsx("div", { className: "text-[8px] text-amber-500", children: "คน" })
                                        ]
                                      })
                                    ]
                                  }),

                                  /* Overall Percentage */
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "flex justify-between items-center text-xs font-bold px-1",
                                    children: [
                                      /*#__PURE__*/_jsx("span", { className: "text-slate-700", children: "ร้อยละการมาแถวรวม" }),
                                      /*#__PURE__*/_jsxs("span", { className: "text-emerald-600 font-mono", children: [reportData.overallPercent, "%"] })
                                    ]
                                  }),

                                  /* Progress Bar */
                                  /*#__PURE__*/_jsx("div", {
                                    className: "w-full h-1.5 bg-slate-200 rounded-full overflow-hidden",
                                    children: /*#__PURE__*/_jsx("div", {
                                      className: "h-full bg-emerald-500 rounded-full",
                                      style: { width: `${reportData.overallPercent}%` }
                                    })
                                  }),

                                  /* Departments Breakdown Header */
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "flex justify-between items-center pt-1 text-[11px] font-bold border-t border-slate-100",
                                    children: [
                                      /*#__PURE__*/_jsx("span", { className: "text-slate-800", children: "📊 ยอดเข้าแถวแยกแผนก" }),
                                      /*#__PURE__*/_jsxs("span", {
                                        className: `text-[10px] ${reportData.checkedCount === 8 ? 'text-emerald-600' : 'text-amber-600'}`,
                                        children: ["ส่ง ", reportData.checkedCount, "/8"]
                                      })
                                    ]
                                  }),

                                  /* Departments List */
                                  /*#__PURE__*/_jsx("div", {
                                    className: "space-y-1 text-[11px]",
                                    children: reportData.deptList.map(d => /*#__PURE__*/_jsxs("div", {
                                      className: "flex items-center justify-between py-0.5 border-b border-slate-50 last:border-0",
                                      children: [
                                        /*#__PURE__*/_jsx("span", { className: "text-slate-700 truncate max-w-[130px]", children: d.name }),
                                        /*#__PURE__*/_jsxs("div", {
                                          className: "flex items-center gap-1 font-mono text-[10px]",
                                          children: [
                                            /*#__PURE__*/_jsxs("span", { className: d.isCheckedIn ? "font-bold text-slate-800" : "text-slate-400 italic", children: [d.present, "/", d.total] }),
                                            /*#__PURE__*/_jsxs("span", {
                                              className: `px-1 rounded ${d.percent >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} font-bold`,
                                              children: [d.percent, "%"]
                                            })
                                          ]
                                        })
                                      ]
                                    }, d.name))
                                  })
                                ]
                              }),

                              /* Bubble Footer */
                              /*#__PURE__*/_jsxs("div", {
                                className: "p-2.5 bg-slate-50 border-t border-slate-100 text-center space-y-1.5",
                                children: [
                                  /*#__PURE__*/_jsx("a", {
                                    href: dashboardUrl,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "block w-full py-1.5 rounded-xl bg-[#590b14] hover:bg-[#43080e] text-white text-[11px] font-bold shadow-xs transition-colors",
                                    children: "📊 ดูแดชบอร์ดฉบับเต็ม"
                                  }),
                                  /*#__PURE__*/_jsx("div", {
                                    className: "text-[9px] text-slate-400",
                                    children: "ระบบเช็คชื่อเข้าแถวดิจิทัล • วก.ด่านซ้าย"
                                  })
                                ]
                              })
                            ]
                          })
                        ) : previewTab === 'text' ? (
                          /* Text Bubble Preview */
                          /*#__PURE__*/_jsxs("div", {
                            className: "bg-white p-3 rounded-2xl rounded-tl-sm shadow-xs border border-slate-200 text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap font-sans relative",
                            children: [
                              reportData.textMessage,
                              /*#__PURE__*/_jsx("div", { className: "text-[9px] text-slate-400 text-right mt-1 font-mono", children: "08:20 น. ✓✓" })
                            ]
                          })
                        ) : (
                          /* JSON Bubble Preview */
                          /*#__PURE__*/_jsxs("div", {
                            className: "bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[9px] overflow-x-auto relative space-y-2",
                            children: [
                              /*#__PURE__*/_jsx("button", {
                                type: "button",
                                onClick: handleCopyJson,
                                className: "sticky top-0 float-right px-2 py-0.5 rounded bg-white/20 text-white hover:bg-white/30 text-[9px]",
                                children: copied === 'json' ? 'คัดลอกแล้ว!' : 'Copy JSON'
                              }),
                              /*#__PURE__*/_jsx("pre", {
                                children: JSON.stringify(reportData.flexMessage, null, 2)
                              })
                            ]
                          })
                        )
                      })
                    ]
                  }),

                  /* Home Indicator */
                  /*#__PURE__*/_jsx("div", {
                    className: "w-32 h-1 bg-slate-700 rounded-full mx-auto mt-2"
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ==========================================
// COMPONENT: ระบบกิจกรรมชมรมวิชาชีพ (Vocational Club Activities - อวท.)
// ==========================================
function ClubActivityView({
  masterStudents = [],
  teachersList = [],
  departments = [],
  academicYear,
  semester,
  onOpenStudentDetail,
  studentPhotosMap = {},
  isAdminLoggedIn = false,
  onOpenAdminEdit
}) {
  const [selectedClubDept, setSelectedClubDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  
  // Interactive Check-in Form Preview (ช่องเตรียมไว้ให้กรอกในเทอมถัดไป)
  const [checkinDept, setCheckinDept] = useState(departments[0] || 'ช่างยนต์');
  const [checkinDate, setCheckinDate] = useState(() => formatLocalDate(new Date()));
  const [sessionNumber, setSessionNumber] = useState(1);
  const [activityDetails, setActivityDetails] = useState('การประชุมวางแผนจัดทำโครงการวิชาชีพ อวท. และตรวจเช็คความพร้อมเครื่องมืออุปกรณ์ประจำแผนก');
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isCheckinFormExpanded, setIsCheckinFormExpanded] = useState(true);
  const [savedLogs, setSavedLogs] = useState([]);

  function getClubName(dept) {
    const clean = normalizeDepartmentName(dept);
    if (!clean || clean === 'ทั่วไป') return 'ชมรมวิชาชีพรวม';
    if (clean.startsWith('ชมรมวิชาชีพ')) return clean;
    return `ชมรมวิชาชีพ${clean}`;
  }

  const clubAdvisor = useMemo(() => {
    return (teachersList || []).find(t => normalizeDepartmentName(t.department) === normalizeDepartmentName(checkinDept));
  }, [teachersList, checkinDept]);

  const checkinStudents = useMemo(() => {
    return masterStudents.filter(s => normalizeDepartmentName(s.dept) === normalizeDepartmentName(checkinDept));
  }, [masterStudents, checkinDept]);

  const handleMarkAll = (status) => {
    const updated = { ...attendanceMap };
    checkinStudents.forEach(s => {
      const key = s.id || s.name;
      updated[key] = status;
    });
    setAttendanceMap(updated);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEvidencePhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitCheckin = (e) => {
    e.preventDefault();
    if (!activityDetails.trim()) {
      alert('กรุณาระบุรายละเอียดเพิ่มเติมว่าชมรมตัวเองทำกิจกรรมอะไรบ้าง');
      return;
    }
    const presentCount = checkinStudents.filter(s => (attendanceMap[s.id || s.name] || 'present') === 'present').length;
    const absentCount = checkinStudents.filter(s => attendanceMap[s.id || s.name] === 'absent').length;
    const leaveCount = checkinStudents.filter(s => attendanceMap[s.id || s.name] === 'leave').length;

    const newLog = {
      id: Date.now(),
      clubName: getClubName(checkinDept),
      dept: checkinDept,
      advisor: clubAdvisor ? clubAdvisor.name : '—',
      date: checkinDate,
      session: sessionNumber,
      details: activityDetails.trim(),
      photo: evidencePhoto,
      presentCount,
      absentCount,
      leaveCount,
      totalCount: checkinStudents.length
    };

    setSavedLogs(prev => [newLog, ...prev]);
    alert(`บันทึกข้อมูลกิจกรรมชมรมเรียบร้อยแล้ว!\n\n• ชมรม: ${getClubName(checkinDept)}\n• ครูที่ปรึกษา: ${clubAdvisor ? clubAdvisor.name : '—'}\n• วันที่: ${checkinDate} (ครั้งที่ ${sessionNumber})\n• กิจกรรมที่ทำ: ${activityDetails.trim()}\n• สมาชิกเข้าร่วม: มา ${presentCount} / ขาด ${absentCount} / ลา ${leaveCount} คน\n\n(บันทึกจำลองสำหรับเตรียมความพร้อมในภาคเรียนที่ 2 เรียบร้อย)`);
  };

  const clubLevels = useMemo(() => {
    const s = new Set();
    masterStudents.forEach(st => {
      if (selectedClubDept === 'ALL' || normalizeDepartmentName(st.dept) === normalizeDepartmentName(selectedClubDept)) {
        if (st.level) s.add(st.level);
      }
    });
    return Array.from(s).sort();
  }, [masterStudents, selectedClubDept]);

  const filteredClubStudents = useMemo(() => {
    return masterStudents.filter(s => {
      if (selectedClubDept !== 'ALL' && normalizeDepartmentName(s.dept) !== normalizeDepartmentName(selectedClubDept)) return false;
      if (selectedLevel !== 'ALL' && s.level !== selectedLevel) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchId = (s.student_id || s.id || '').toLowerCase().includes(q);
        const matchDept = (s.dept || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [masterStudents, selectedClubDept, selectedLevel, search]);

  const totalMembers = masterStudents.length;
  const totalClubs = departments.length;

  return /*#__PURE__*/_jsxs("div", {
    className: "space-y-4 sm:space-y-6",
    children: [
      /* Top Mode Banner */
      /*#__PURE__*/_jsxs("div", {
        className: "p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-500/80",
        children: [
          /*#__PURE__*/_jsxs("div", {
            className: "flex items-start gap-3.5",
            children: [
              /*#__PURE__*/_jsx("div", {
                className: "w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center text-xl flex-shrink-0 border border-white/20 backdrop-blur-xs shadow-inner",
                children: /*#__PURE__*/_jsx(Icon.Award, { className: "w-7 h-7 text-amber-200" })
              }),
              /*#__PURE__*/_jsxs("div", {
                children: [
                  /*#__PURE__*/_jsxs("h2", {
                    className: "text-base sm:text-lg font-bold text-white flex items-center gap-2",
                    children: [
                      "ระบบเช็คชื่อกิจกรรมชมรมวิชาชีพ (อวท.)",
                      /*#__PURE__*/_jsx("span", {
                        className: "text-[10px] bg-white text-amber-900 px-2.5 py-0.5 rounded-full font-bold shadow-xs",
                        children: "องค์การนักวิชาชีพฯ"
                      })
                    ]
                  }),
                  /*#__PURE__*/_jsxs("p", {
                    className: "text-xs text-amber-100/90 mt-1 leading-relaxed",
                    children: [
                      "กิจกรรมชมรมวิชาชีพประจำแผนกวิชา วิทยาลัยการอาชีพด่านซ้าย • ภาคเรียนที่ ",
                      semester, "/", academicYear
                    ]
                  })
                ]
              })
            ]
          }),
          /*#__PURE__*/_jsxs("div", {
            className: "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-semibold backdrop-blur-xs self-start sm:self-auto shadow-xs",
            children: [
              /*#__PURE__*/_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" }),
              /*#__PURE__*/_jsx("span", { children: "เทอม 2 พร้อมเปิดระบบเช็คชื่อ" })
            ]
          })
        ]
      }),

      /* Term Notice Alert: เทอม 1 เตรียมข้อมูล / เทอม 2 ครูเช็คและกรอกกิจกรรม */
      /*#__PURE__*/_jsxs("div", {
        className: "p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 shadow-xs",
        children: [
          /*#__PURE__*/_jsx(Icon.Info, { className: "w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" }),
          /*#__PURE__*/_jsxs("div", {
            className: "text-xs text-amber-900 space-y-1",
            children: [
              /*#__PURE__*/_jsx("p", {
                className: "font-bold text-amber-950",
                children: "ข้อตกลงและแนวทางการประเมินกิจกรรมชมรมวิชาชีพ:"
              }),
              /*#__PURE__*/_jsxs("ul", {
                className: "list-disc pl-4 space-y-0.5 text-amber-800 leading-relaxed",
                children: [
                  /*#__PURE__*/_jsx("li", {
                    children: "ภาคเรียนที่ 1: เตรียมความพร้อมฐานข้อมูลสมาชิกและชมรม (นักเรียนทุกคนได้รับสิทธิ์ผ่านกิจกรรมตามนโยบายเตรียมพร้อม โดยไม่ต้องคีย์เอง)"
                  }),
                  /*#__PURE__*/_jsxs("li", {
                    children: [
                      /*#__PURE__*/_jsx("strong", { className: "text-amber-950", children: "ภาคเรียนที่ 2 เป็นต้นไป:" }),
                      " คุณครูที่ปรึกษาชมรมจะเข้าสู่ระบบเพื่อเช็คชื่อสมาชิกชมรม พร้อมแนบรูปถ่าย และกรอกรายละเอียดในช่อง ",
                      /*#__PURE__*/_jsx("strong", { className: "text-amber-950 underline", children: "“บันทึกว่าชมรมตัวเองทำกิจกรรมอะไรบ้าง”" }),
                      " ในแต่ละสัปดาห์"
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      /* Metrics Section for Clubs */
      /*#__PURE__*/_jsxs("section", {
        className: "grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4",
        children: [
          /* Stat 1: ชมรมทั้งหมด */
          /*#__PURE__*/_jsxs("div", {
            className: "bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between",
            children: [
              /*#__PURE__*/_jsx("div", { className: "text-xs font-semibold text-slate-500", children: "ชมรมวิชาชีพทั้งหมด" }),
              /*#__PURE__*/_jsxs("div", {
                className: "text-xl sm:text-3xl font-black font-mono text-slate-900 mt-1",
                children: [totalClubs, " ", /*#__PURE__*/_jsx("span", { className: "text-xs text-slate-400 font-normal", children: "ชมรม" })]
              }),
              /*#__PURE__*/_jsx("div", {
                className: "w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden",
                children: /*#__PURE__*/_jsx("div", { className: "bg-amber-600 h-full w-full" })
              })
            ]
          }),

          /* Stat 2: สมาชิกทั้งหมด */
          /*#__PURE__*/_jsxs("div", {
            className: "bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between",
            children: [
              /*#__PURE__*/_jsx("div", { className: "text-xs font-semibold text-slate-500", children: "สมาชิกชมรมรวม" }),
              /*#__PURE__*/_jsxs("div", {
                className: "text-xl sm:text-3xl font-black font-mono text-slate-900 mt-1",
                children: [totalMembers, " ", /*#__PURE__*/_jsx("span", { className: "text-xs text-slate-400 font-normal", children: "คน" })]
              }),
              /*#__PURE__*/_jsx("div", {
                className: "w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden",
                children: /*#__PURE__*/_jsx("div", { className: "bg-sky-600 h-full w-full" })
              })
            ]
          }),

          /* Stat 3: ครูที่ปรึกษา */
          /*#__PURE__*/_jsxs("div", {
            className: "bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between",
            children: [
              /*#__PURE__*/_jsx("div", { className: "text-xs font-semibold text-slate-500", children: "ครูที่ปรึกษาประจำชมรม" }),
              /*#__PURE__*/_jsxs("div", {
                className: "text-xl sm:text-3xl font-black font-mono text-slate-900 mt-1",
                children: [teachersList.length, " ", /*#__PURE__*/_jsx("span", { className: "text-xs text-slate-400 font-normal", children: "ท่าน" })]
              }),
              /*#__PURE__*/_jsx("div", {
                className: "w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden",
                children: /*#__PURE__*/_jsx("div", { className: "bg-indigo-600 h-full w-full" })
              })
            ]
          }),

          /* Stat 4: สถานะเทอม 1 */
          /*#__PURE__*/_jsxs("div", {
            className: "bg-white p-3.5 sm:p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between",
            children: [
              /*#__PURE__*/_jsx("div", { className: "text-xs font-semibold text-emerald-700", children: "ผลการประเมิน (เทอม 1)" }),
              /*#__PURE__*/_jsx("div", {
                className: "text-lg sm:text-2xl font-black text-emerald-700 mt-1",
                children: "ผ่าน 100%"
              }),
              /*#__PURE__*/_jsx("div", {
                className: "w-full bg-emerald-50 h-1.5 rounded-full mt-2.5 overflow-hidden",
                children: /*#__PURE__*/_jsx("div", { className: "bg-emerald-500 h-full w-full" })
              })
            ]
          })
        ]
      }),

      /* ========================================================= */
      /* TEACHER CHECK-IN PREVIEW FORM (ช่องเตรียมไว้ให้กรอกในเทอมถัดไป) */
      /* ========================================================= */
      /*#__PURE__*/_jsxs("div", {
        className: "bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden",
        children: [
          /* Form Accordion Header */
          /*#__PURE__*/_jsxs("div", {
            onClick: () => setIsCheckinFormExpanded(!isCheckinFormExpanded),
            className: "p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-white to-amber-50 border-b border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-50/60 transition-colors select-none",
            children: [
              /*#__PURE__*/_jsxs("div", {
                className: "flex items-center gap-3",
                children: [
                  /*#__PURE__*/_jsx("div", {
                    className: "w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs",
                    children: /*#__PURE__*/_jsx(Icon.Edit, { className: "w-5 h-5 text-white" })
                  }),
                  /*#__PURE__*/_jsxs("div", {
                    children: [
                      /*#__PURE__*/_jsxs("h3", {
                        className: "text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2",
                        children: [
                          "ระบบจำลองการเช็คชื่อ & บันทึกกิจกรรมชมรมสำหรับครูที่ปรึกษา",
                          /*#__PURE__*/_jsx("span", {
                            className: "text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold",
                            children: "เตรียมใช้งานเทอม 2"
                          })
                        ]
                      }),
                      /*#__PURE__*/_jsx("p", {
                        className: "text-xs text-amber-800/80 mt-0.5",
                        children: "ทดลองกรอกรายละเอียดกิจกรรมที่ชมรมดำเนินการ และเช็คชื่อสมาชิกชมรม"
                      })
                    ]
                  })
                ]
              }),
              /*#__PURE__*/_jsx("span", {
                className: "text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-200",
                children: isCheckinFormExpanded ? '▲ ซ่อนฟอร์ม' : '▼ แสดงฟอร์มเช็คชื่อ'
              })
            ]
          }),

          /* Form Body */
          isCheckinFormExpanded && /*#__PURE__*/_jsxs("form", {
            onSubmit: handleSubmitCheckin,
            className: "p-4 sm:p-6 space-y-4 text-xs",
            children: [
              /* Row 1: Club selection, Advisor, Date, Session */
              /*#__PURE__*/_jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-4 gap-3",
                children: [
                  /* Select Club */
                  /*#__PURE__*/_jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      /*#__PURE__*/_jsx("label", {
                        className: "font-bold text-slate-700 block",
                        children: "ชมรมวิชาชีพ / แผนกวิชา:"
                      }),
                      /*#__PURE__*/_jsx("select", {
                        value: checkinDept,
                        onChange: e => setCheckinDept(e.target.value),
                        className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500",
                        children: departments.map(d => /*#__PURE__*/_jsxs("option", { value: d, children: [getClubName(d), " (", formatDeptDisplay(d), ")"] }, d))
                      })
                    ]
                  }),

                  /* Advisor Name */
                  /*#__PURE__*/_jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      /*#__PURE__*/_jsx("label", {
                        className: "font-bold text-slate-700 block",
                        children: "ครูที่ปรึกษาชมรม:"
                      }),
                      /*#__PURE__*/_jsx("div", {
                        className: "w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 truncate",
                        children: clubAdvisor ? clubAdvisor.name : '— ยังไม่ได้ระบุ —'
                      })
                    ]
                  }),

                  /* Date Picker */
                  /*#__PURE__*/_jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      /*#__PURE__*/_jsx("label", {
                        className: "font-bold text-slate-700 block",
                        children: "วันที่จัดกิจกรรม:"
                      }),
                      /*#__PURE__*/_jsx("input", {
                        type: "date",
                        value: checkinDate,
                        onChange: e => setCheckinDate(e.target.value),
                        className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      })
                    ]
                  }),

                  /* Session Number */
                  /*#__PURE__*/_jsxs("div", {
                    className: "space-y-1.5",
                    children: [
                      /*#__PURE__*/_jsx("label", {
                        className: "font-bold text-slate-700 block",
                        children: "ครั้งที่ / สัปดาห์ที่:"
                      }),
                      /*#__PURE__*/_jsx("input", {
                        type: "number",
                        min: "1",
                        max: "18",
                        value: sessionNumber,
                        onChange: e => setSessionNumber(Number(e.target.value)),
                        className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      })
                    ]
                  })
                ]
              }),

              /* Row 2: REQUIRED TEXTAREA - "ชมรมตัวเองทำกิจกรรมอะไรบ้าง" */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80",
                children: [
                  /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      /*#__PURE__*/_jsxs("label", {
                        className: "font-bold text-amber-950 flex items-center gap-1.5",
                        children: [
                          /*#__PURE__*/_jsx(Icon.Document, { className: "w-4 h-4 text-amber-700" }),
                          "บันทึกรายละเอียดการจัดกิจกรรมชมรม (ชมรมตัวเองทำกิจกรรมอะไรบ้าง):",
                          /*#__PURE__*/_jsx("span", { className: "text-rose-600 font-bold", children: "*" })
                        ]
                      }),
                      /*#__PURE__*/_jsx("span", {
                        className: "text-[11px] text-amber-800 font-medium",
                        children: "ช่องกรอกสำหรับครูที่ปรึกษาชมรม"
                      })
                    ]
                  }),
                  /*#__PURE__*/_jsx("textarea", {
                    required: true,
                    rows: 3,
                    value: activityDetails,
                    onChange: e => setActivityDetails(e.target.value),
                    placeholder: "ระบุรายละเอียดกิจกรรมที่ชมรมดำเนินการ เช่น การประชุมวางแผนกิจกรรม อวท., ฝึกปฏิบัติการตรวจเช็คเครื่องมืออุปกรณ์ประจำแผนก, ผลิตชิ้นงานสิ่งประดิษฐ์ของคนรุ่นใหม่, กิจกรรมจิตอาสาบริการวิชาชีพสู่ชุมชน...",
                    className: "w-full bg-white border border-amber-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed shadow-2xs"
                  }),
                  /*#__PURE__*/_jsx("p", {
                    className: "text-[11px] text-amber-700",
                    children: "หมายเหตุ: ข้อมูลนี้จะถูกบันทึกเพื่อใช้เป็นหลักฐานประกอบการประเมินกิจกรรมชมรมวิชาชีพประจำภาคเรียน"
                  })
                ]
              }),

              /* Row 3: Photo evidence capture/upload */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-1.5",
                children: [
                  /*#__PURE__*/_jsxs("label", {
                    className: "font-bold text-slate-700 flex items-center gap-1.5",
                    children: [
                      /*#__PURE__*/_jsx(Icon.Camera, { className: "w-4 h-4 text-slate-500" }),
                      "รูปถ่ายหลักฐานการจัดกิจกรรมชมรม:"
                    ]
                  }),
                  /*#__PURE__*/_jsxs("div", {
                    className: "flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl",
                    children: [
                      evidencePhoto ? /*#__PURE__*/_jsxs("div", {
                        className: "relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 flex-shrink-0 shadow-xs",
                        children: [
                          /*#__PURE__*/_jsx("img", { src: evidencePhoto, alt: "รูปกิจกรรมชมรม", className: "w-full h-full object-cover" }),
                          /*#__PURE__*/_jsx("button", {
                            type: "button",
                            onClick: () => setEvidencePhoto(null),
                            className: "absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-xs cursor-pointer",
                            title: "ลบรูปถ่าย",
                            children: "×"
                          })
                        ]
                      }) : /*#__PURE__*/_jsxs("div", {
                        className: "w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 flex-shrink-0",
                        children: [
                          /*#__PURE__*/_jsx(Icon.Camera, { className: "w-6 h-6 text-slate-400" }),
                          /*#__PURE__*/_jsx("span", { className: "text-[9px] mt-1 font-bold", children: "ไม่มีรูป" })
                        ]
                      }),
                      /*#__PURE__*/_jsxs("div", {
                        className: "space-y-1 flex-1 min-w-0",
                        children: [
                          /*#__PURE__*/_jsx("input", {
                            type: "file",
                            accept: "image/*",
                            onChange: handlePhotoSelect,
                            className: "text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer text-slate-500"
                          }),
                          /*#__PURE__*/_jsx("p", {
                            className: "text-[11px] text-slate-400",
                            children: "ถ่ายภาพบรรยากาศการดำเนินกิจกรรมชมรม หรืออัปโหลดไฟล์รูปภาพหลักฐาน (รองรับ JPG, PNG)"
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),

              /* Row 4: Student Attendance Checklist for this Club */
              /*#__PURE__*/_jsxs("div", {
                className: "space-y-2 pt-2 border-t border-slate-100",
                children: [
                  /*#__PURE__*/_jsxs("div", {
                    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2",
                    children: [
                      /*#__PURE__*/_jsxs("div", {
                        children: [
                          /*#__PURE__*/_jsxs("h4", {
                            className: "font-bold text-slate-800 flex items-center gap-1.5",
                            children: [
                              /*#__PURE__*/_jsx(Icon.Users, { className: "w-4 h-4 text-slate-500" }),
                              "เช็คชื่อสมาชิก", getClubName(checkinDept), " (", checkinStudents.length, " คน)"
                            ]
                          }),
                          /*#__PURE__*/_jsx("p", {
                            className: "text-[11px] text-slate-400",
                            children: "ติ๊กสถานะการเข้าร่วมกิจกรรมของสมาชิกชมรมแต่ละคน"
                          })
                        ]
                      }),
                      /*#__PURE__*/_jsxs("div", {
                        className: "flex items-center gap-1.5 flex-shrink-0",
                        children: [
                          /*#__PURE__*/_jsxs("button", {
                            type: "button",
                            onClick: () => handleMarkAll('present'),
                            className: "px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 cursor-pointer transition-colors flex items-center gap-1",
                            children: [/*#__PURE__*/_jsx(Icon.Check, { className: "w-3 h-3 text-emerald-600" }), "มาทุกคน (100%)"]
                          }),
                          /*#__PURE__*/_jsx("button", {
                            type: "button",
                            onClick: () => handleMarkAll('absent'),
                            className: "px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer transition-colors",
                            children: "ขาดทุกคน"
                          })
                        ]
                      })
                    ]
                  }),

                  /* Table of members in check-in form */
                  /*#__PURE__*/_jsx("div", {
                    className: "max-h-64 overflow-y-auto custom-scroll border border-slate-200 rounded-2xl overflow-hidden",
                    children: checkinStudents.length === 0 ? (
                      /*#__PURE__*/_jsx("div", {
                        className: "p-6 text-center text-slate-400 text-xs",
                        children: "ไม่มีข้อมูลนักเรียนในชมรมนี้"
                      })
                    ) : (
                      /*#__PURE__*/_jsxs("table", {
                        className: "w-full text-xs",
                        children: [
                          /*#__PURE__*/_jsx("thead", {
                            children: /*#__PURE__*/_jsxs("tr", {
                              className: "bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold",
                              children: [
                                /*#__PURE__*/_jsx("th", { className: "py-2 px-3 text-center w-10", children: "#" }),
                                /*#__PURE__*/_jsx("th", { className: "py-2 px-3 text-left", children: "ชื่อ - นามสกุล" }),
                                /*#__PURE__*/_jsx("th", { className: "py-2 px-3 text-left w-24", children: "ระดับชั้น" }),
                                /*#__PURE__*/_jsx("th", { className: "py-2 px-3 text-right pr-4 w-40", children: "สถานะการมา" })
                              ]
                            })
                          }),
                          /*#__PURE__*/_jsx("tbody", {
                            className: "divide-y divide-slate-100 bg-white",
                            children: checkinStudents.map((s, idx) => {
                              const key = s.id || s.name;
                              const currentStatus = attendanceMap[key] || 'present';
                              return /*#__PURE__*/_jsxs("tr", {
                                className: "hover:bg-slate-50/80 transition-colors",
                                children: [
                                  /*#__PURE__*/_jsx("td", { className: "py-2 px-3 text-center text-slate-400 font-mono text-[11px]", children: idx + 1 }),
                                  /*#__PURE__*/_jsx("td", { className: "py-2 px-3 font-semibold text-slate-800", children: s.name }),
                                  /*#__PURE__*/_jsx("td", { className: "py-2 px-3 text-slate-500 text-[11px]", children: s.level }),
                                  /*#__PURE__*/_jsx("td", {
                                    className: "py-2 px-3 text-right pr-4",
                                    children: /*#__PURE__*/_jsxs("div", {
                                      className: "inline-flex items-center gap-1",
                                      children: [
                                        /*#__PURE__*/_jsx("button", {
                                          type: "button",
                                          onClick: () => setAttendanceMap(prev => ({ ...prev, [key]: 'present' })),
                                          className: `px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
                                          children: "มา"
                                        }),
                                        /*#__PURE__*/_jsx("button", {
                                          type: "button",
                                          onClick: () => setAttendanceMap(prev => ({ ...prev, [key]: 'absent' })),
                                          className: `px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${currentStatus === 'absent' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
                                          children: "ขาด"
                                        }),
                                        /*#__PURE__*/_jsx("button", {
                                          type: "button",
                                          onClick: () => setAttendanceMap(prev => ({ ...prev, [key]: 'leave' })),
                                          className: `px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${currentStatus === 'leave' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
                                          children: "ลา"
                                        })
                                      ]
                                    })
                                  })
                                ]
                              }, key);
                            })
                          })
                        ]
                      })
                    )
                  })
                ]
              }),

              /* Submit Button */
              /*#__PURE__*/_jsxs("div", {
                className: "pt-2 flex justify-end gap-2 border-t border-slate-100",
                children: [
                  /*#__PURE__*/_jsxs("button", {
                    type: "submit",
                    className: "px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2",
                    children: [
                      /*#__PURE__*/_jsx(Icon.Check, { className: "w-4 h-4 text-white" }),
                      "บันทึกกิจกรรมและเช็คชื่อชมรม (เตรียมพร้อมเทอม 2)"
                    ]
                  })
                ]
              })
            ]
          }),

          /* Saved Logs Feed (if any recorded in current session) */
          savedLogs.length > 0 && /*#__PURE__*/_jsxs("div", {
            className: "p-4 bg-amber-50/40 border-t border-amber-200/60 space-y-2",
            children: [
              /*#__PURE__*/_jsxs("h4", {
                className: "text-xs font-bold text-amber-950 flex items-center gap-1.5",
                children: [
                  /*#__PURE__*/_jsx(Icon.Document, { className: "w-4 h-4 text-amber-700" }),
                  "ประวัติการบันทึกกิจกรรมชมรมในรอบนี้ (", savedLogs.length, " ครั้ง)"
                ]
              }),
              /*#__PURE__*/_jsx("div", {
                className: "space-y-2",
                children: savedLogs.map(log => /*#__PURE__*/_jsxs("div", {
                  className: "p-3 bg-white rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between gap-3 text-xs",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-1 min-w-0",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "font-bold text-slate-900 flex items-center gap-2",
                          children: [
                            log.clubName,
                            /*#__PURE__*/_jsxs("span", { className: "text-slate-400 font-normal", children: ["(ครั้งที่ ", log.session, " • ", log.date, ")"] }),
                            /*#__PURE__*/_jsxs("span", { className: "text-slate-500 font-normal", children: ["ครูผู้บันทึก: ", log.advisor] })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("p", {
                          className: "text-slate-600 truncate max-w-xl",
                          children: [/*#__PURE__*/_jsx("strong", { children: "กิจกรรม: " }), log.details]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "text-[11px] text-slate-500 flex items-center gap-2 font-mono",
                          children: [
                            /*#__PURE__*/_jsxs("span", { className: "text-emerald-700 font-bold", children: ["มา ", log.presentCount] }),
                            /*#__PURE__*/_jsxs("span", { className: "text-rose-600 font-bold", children: ["ขาด ", log.absentCount] }),
                            /*#__PURE__*/_jsxs("span", { className: "text-amber-600 font-bold", children: ["ลา ", log.leaveCount] }),
                            /*#__PURE__*/_jsxs("span", { className: "text-slate-400", children: ["จากทั้งหมด ", log.totalCount, " คน"] })
                          ]
                        })
                      ]
                    }),
                    log.photo && /*#__PURE__*/_jsx("img", {
                      src: log.photo,
                      alt: "หลักฐาน",
                      className: "w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    })
                  ]
                }, log.id))
              })
            ]
          })
        ]
      }),

      /* ========================================================= */
      /* CLUB MEMBER ROSTER & FILTER SECTION */
      /* ========================================================= */
      /*#__PURE__*/_jsxs("section", {
        className: "bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3",
        children: [
          /* Filter Bar */
          /*#__PURE__*/_jsxs("div", {
            className: "grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3",
            children: [
              /* Search Input */
              /*#__PURE__*/_jsx("div", {
                className: "sm:col-span-6 relative",
                children: /*#__PURE__*/_jsx("input", {
                  type: "search",
                  value: search,
                  onChange: e => setSearch(e.target.value),
                  placeholder: "ค้นหาชื่อสมาชิกชมรม หรือรหัสนักเรียน...",
                  className: "w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-3.5 py-2 sm:py-2.5 focus:outline-none focus:bg-white focus:border-amber-500 transition-all"
                })
              }),

              /* Select Club */
              /*#__PURE__*/_jsx("div", {
                className: "sm:col-span-3",
                children: /*#__PURE__*/_jsxs("select", {
                  value: selectedClubDept,
                  onChange: e => { setSelectedClubDept(e.target.value); setSelectedLevel('ALL'); },
                  className: "w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-2.5 py-2 sm:py-2.5 cursor-pointer",
                  children: [
                    /*#__PURE__*/_jsx("option", { value: "ALL", children: "ทุกชมรมวิชาชีพ" }),
                    departments.map(d => /*#__PURE__*/_jsxs("option", { value: d, children: [getClubName(d)] }, d))
                  ]
                })
              }),

              /* Select Level */
              /*#__PURE__*/_jsx("div", {
                className: "sm:col-span-3",
                children: /*#__PURE__*/_jsxs("select", {
                  value: selectedLevel,
                  onChange: e => setSelectedLevel(e.target.value),
                  className: "w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-2.5 py-2 sm:py-2.5 cursor-pointer",
                  children: [
                    /*#__PURE__*/_jsx("option", { value: "ALL", children: "ทุกระดับชั้น" }),
                    clubLevels.map(l => /*#__PURE__*/_jsx("option", { value: l, children: l }, l))
                  ]
                })
              })
            ]
          }),

          /* Results summary */
          /*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500",
            children: [
              /*#__PURE__*/_jsxs("span", {
                children: [
                  "แสดงสมาชิกชมรม: ",
                  /*#__PURE__*/_jsx("strong", { className: "text-slate-800", children: filteredClubStudents.length }),
                  " คน",
                  selectedClubDept !== 'ALL' && /*#__PURE__*/_jsxs("span", { className: "text-amber-700 font-semibold ml-1", children: ["(", getClubName(selectedClubDept), ")"] })
                ]
              }),
              /*#__PURE__*/_jsx("span", {
                className: "text-[11px] text-slate-400",
                children: "ข้อมูลชมรมวิชาชีพ อวท. • วิทยาลัยการอาชีพด่านซ้าย"
              })
            ]
          })
        ]
      }),

      /* ========================================================= */
      /* CLUB STUDENTS TABLE (DESKTOP & MOBILE) */
      /* ========================================================= */
      /*#__PURE__*/_jsx("div", {
        className: "bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden",
        children: filteredClubStudents.length === 0 ? (
          /*#__PURE__*/_jsxs("div", {
            className: "py-16 text-center text-slate-400 space-y-2",
            children: [
              /*#__PURE__*/_jsx(Icon.Award, { className: "w-10 h-10 text-slate-300 mx-auto" }),
              /*#__PURE__*/_jsx("p", { className: "text-sm font-semibold", children: "ไม่พบข้อมูลสมาชิกชมรมตามเงื่อนไขที่เลือก" })
            ]
          })
        ) : (
          /* Desktop Table */
          /*#__PURE__*/_jsxs("div", {
            className: "overflow-x-auto",
            children: [
              /*#__PURE__*/_jsxs("table", {
                className: "w-full text-left text-xs whitespace-nowrap",
                children: [
                  /*#__PURE__*/_jsx("thead", {
                    children: /*#__PURE__*/_jsxs("tr", {
                      className: "bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold",
                      children: [
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4 text-center w-14", children: "ลำดับ" }),
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4", children: "ชื่อ - นามสกุล" }),
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4", children: "ระดับชั้น" }),
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4", children: "ชมรมวิชาชีพ (อวท.)" }),
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4", children: "ครูที่ปรึกษาชมรม" }),
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4 text-center w-36", children: "สถานะกิจกรรมชมรม" }),
                        /*#__PURE__*/_jsx("th", { className: "py-3.5 px-4 text-right pr-6 w-32", children: "การจัดการ" })
                      ]
                    })
                  }),
                  /*#__PURE__*/_jsx("tbody", {
                    className: "divide-y divide-slate-100",
                    children: filteredClubStudents.map((s, idx) => {
                      const matchedAdvisor = (teachersList || []).find(t => normalizeDepartmentName(t.department) === normalizeDepartmentName(s.dept));
                      return /*#__PURE__*/_jsxs("tr", {
                        className: "hover:bg-slate-50/80 transition-colors",
                        children: [
                          /*#__PURE__*/_jsx("td", { className: "py-3 px-4 text-center font-mono text-xs text-slate-400", children: idx + 1 }),
                          /*#__PURE__*/_jsx("td", {
                            className: "py-3 px-4",
                            children: /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center gap-3",
                              children: [
                                /* Student avatar */
                                /*#__PURE__*/_jsx("div", {
                                  className: "w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-xs text-amber-800 select-none shadow-2xs",
                                  children: (s.photoUrl || studentPhotosMap[s.id] || studentPhotosMap[s.name]) ? (
                                    /*#__PURE__*/_jsx("img", {
                                      src: s.photoUrl || studentPhotosMap[s.id] || studentPhotosMap[s.name],
                                      alt: s.name,
                                      className: "w-full h-full object-cover"
                                    })
                                  ) : (
                                    (s.name || '').replace(/^(?:นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*/g, '').slice(0, 2)
                                  )
                                }),
                                /*#__PURE__*/_jsx("span", { className: "font-semibold text-slate-800", children: s.name }),
                                /* Detail info button */
                                /*#__PURE__*/_jsx("button", {
                                  type: "button",
                                  onClick: (e) => { e.stopPropagation(); onOpenStudentDetail && onOpenStudentDetail(s); },
                                  title: "ดูรายละเอียดเพิ่มเติม & ครูที่ปรึกษา",
                                  className: "p-1 rounded-lg text-sky-600 bg-sky-50 hover:bg-sky-100 hover:text-sky-700 transition-colors flex-shrink-0 cursor-pointer shadow-2xs border border-sky-200/80 ml-0.5",
                                  children: /*#__PURE__*/_jsx(Icon.User, { className: "w-3.5 h-3.5" })
                                }),
                                isAdminLoggedIn && /*#__PURE__*/_jsx("button", {
                                  type: "button",
                                  onClick: (e) => { e.stopPropagation(); onOpenAdminEdit && onOpenAdminEdit(s); },
                                  title: "แอดมิน: แก้ไขรายละเอียดนักเรียน",
                                  className: "p-1 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-colors flex-shrink-0 cursor-pointer shadow-2xs border border-indigo-200/80",
                                  children: /*#__PURE__*/_jsx(Icon.Edit, { className: "w-3.5 h-3.5" })
                                })
                              ]
                            })
                          }),
                          /* Level */
                          /*#__PURE__*/_jsx("td", {
                            className: "py-3 px-4",
                            children: /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium font-mono text-[11px]", children: s.level })
                          }),
                          /* Club Name */
                          /*#__PURE__*/_jsx("td", {
                            className: "py-3 px-4 font-medium text-slate-700",
                            children: getClubName(s.dept)
                          }),
                          /* Club Advisor */
                          /*#__PURE__*/_jsx("td", {
                            className: "py-3 px-4 text-slate-600",
                            children: matchedAdvisor ? matchedAdvisor.name : (s.teacher || '—')
                          }),
                          /* Status */
                          /*#__PURE__*/_jsx("td", {
                            className: "py-3 px-4 text-center",
                            children: /*#__PURE__*/_jsx("span", {
                              className: "px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200",
                              children: "ผ่านกิจกรรม (เทอม 1)"
                            })
                          }),
                          /* Actions */
                          /*#__PURE__*/_jsx("td", {
                            className: "py-3 px-4 text-right pr-6",
                            children: /*#__PURE__*/_jsx("button", {
                              type: "button",
                              onClick: () => onOpenStudentDetail && onOpenStudentDetail(s),
                              className: "text-xs px-3 py-1.5 rounded-xl border font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer transition-colors shadow-2xs",
                              children: "รายละเอียด"
                            })
                          })
                        ]
                      }, s.id || idx);
                    })
                  })
                ]
              })
            ]
          })
        )
      })
    ]
  });
}

// ==========================================
// ==========================================
// =========================================================================
// COMPONENT: จัดการกิจกรรมชมรมในหน้าแอดมิน (Admin Club Activities Tab)
// - เพิ่มครั้งที่จัดกิจกรรมชมรม (Session No, ชื่อครั้ง, วันที่จัด, รายละเอียด)
// - สวิตช์เปิด/ปิด (One-click toggle) ให้ครูเช็คชื่อรายครั้ง ซิงค์เรียลไทม์
// =========================================================================

function AdminClubTab({
  academicYear,
  semester,
  onRefreshParent
}) {
  const [loading, setLoading] = useState(true);
  const [clubSessionsList, setClubSessionsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const [sessionNo, setSessionNo] = useState(1);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load club sessions configuration for current term
  const loadClubSessions = useCallback(async () => {
    setLoading(true);
    try {
      const activeY = String(academicYear || '2569');
      const activeS = String(semester || '1');

      const { data, error } = await dbAssembly
        .from('attendance_checkin_sessions')
        .select('*')
        .eq('department', '__SYSTEM_SETTINGS__')
        .eq('class_level', '__CLUB_ACTIVITIES__')
        .eq('academic_year', activeY)
        .eq('semester', activeS)
        .limit(1);

      if (error) throw error;

      let list = [];
      if (data && data.length > 0 && data[0].notes) {
        try {
          const parsed = JSON.parse(data[0].notes);
          if (Array.isArray(parsed?.sessions)) {
            list = parsed.sessions;
          } else if (Array.isArray(parsed)) {
            list = parsed;
          }
        } catch (_) {}
      }

      setClubSessionsList(list);
      localStorage.setItem(`club_sessions_${activeY}_${activeS}`, JSON.stringify(list));
      try {
        window.dispatchEvent(new CustomEvent('club_sessions_changed', { detail: list }));
      } catch (_) {}
    } catch (err) {
      console.warn('loadClubSessions error:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester]);

  useEffect(() => {
    loadClubSessions();
  }, [loadClubSessions]);

  // Save sessions array to Supabase
  const persistSessions = async (sessionsArray) => {
    const activeY = String(academicYear || '2569');
    const activeS = String(semester || '1');

    const { data: existing } = await dbAssembly
      .from('attendance_checkin_sessions')
      .select('id')
      .eq('department', '__SYSTEM_SETTINGS__')
      .eq('class_level', '__CLUB_ACTIVITIES__')
      .eq('academic_year', activeY)
      .eq('semester', activeS)
      .limit(1);

    const payloadNotes = JSON.stringify({ sessions: sessionsArray });

    if (existing && existing.length > 0) {
      await dbAssembly
        .from('attendance_checkin_sessions')
        .update({ notes: payloadNotes, updated_at: new Date().toISOString() })
        .eq('id', existing[0].id);
    } else {
      await dbAssembly
        .from('attendance_checkin_sessions')
        .insert([{
          check_date: '2026-01-01',
          department: '__SYSTEM_SETTINGS__',
          class_level: '__CLUB_ACTIVITIES__',
          teacher_name: '__ADMIN__',
          academic_year: activeY,
          semester: activeS,
          notes: payloadNotes
        }]);
    }

    localStorage.setItem(`club_sessions_${activeY}_${activeS}`, JSON.stringify(sessionsArray));
    try {
      window.dispatchEvent(new CustomEvent('club_sessions_changed', { detail: sessionsArray }));
    } catch (_) {}
  };

  // Toggle Open/Close Status
  const handleToggleOpen = async (sessionId) => {
    const nextList = clubSessionsList.map(s => {
      if (s.id === sessionId) {
        return { ...s, is_open: !s.is_open };
      }
      return s;
    });

    setClubSessionsList(nextList);
    try {
      await persistSessions(nextList);
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert('บันทึกสถานะเปิด/ปิดกิจกรรมชมรมล้มเหลว: ' + err.message);
      await loadClubSessions();
    }
  };

  // Save New / Edit Session
  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return alert('กรุณาระบุชื่อกิจกรรมชมรม');
    setSaving(true);
    try {
      let nextList = [...clubSessionsList];
      if (editingSession) {
        nextList = nextList.map(s => {
          if (s.id === editingSession.id) {
            return {
              ...s,
              session_no: Number(sessionNo) || 1,
              title: sessionTitle.trim(),
              date: sessionDate || '',
              description: sessionDescription.trim()
            };
          }
          return s;
        });
      } else {
        const newId = `club_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        nextList.push({
          id: newId,
          session_no: Number(sessionNo) || (nextList.length + 1),
          title: sessionTitle.trim(),
          date: sessionDate || '',
          description: sessionDescription.trim(),
          is_open: true
        });
      }

      // Sort by session_no
      nextList.sort((a, b) => (Number(a.session_no) || 0) - (Number(b.session_no) || 0));

      await persistSessions(nextList);
      setClubSessionsList(nextList);
      setIsModalOpen(false);
      setEditingSession(null);
      alert(editingSession ? 'แก้ไขข้อมูลกิจกรรมชมรมเรียบร้อย' : 'เพิ่มครั้งที่จัดกิจกรรมชมรมเรียบร้อย');
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert('บันทึกล้มเหลว: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Session
  const handleDeleteSession = async (session) => {
    if (!confirm(`ต้องการลบ "${session.title}" (ครั้งที่ ${session.session_no}) หรือไม่?`)) return;
    setActionLoading(true);
    try {
      const nextList = clubSessionsList.filter(s => s.id !== session.id);
      await persistSessions(nextList);
      setClubSessionsList(nextList);
      alert(`ลบกิจกรรมชมรมครั้งที่ ${session.session_no} เรียบร้อย`);
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert('ลบล้มเหลว: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return /*#__PURE__*/_jsxs("div", {
    className: "space-y-4",
    children: [
      /* Top Banner */
      /*#__PURE__*/_jsxs("div", {
        className: "p-4 sm:p-5 bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-800/80",
        children: [
          /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-3",
            children: [
              /*#__PURE__*/_jsx("div", {
                className: "w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl flex-shrink-0 border border-amber-400/30",
                children: /*#__PURE__*/_jsx(Icon.Award, { className: "w-6 h-6 text-amber-300" })
              }),
              /*#__PURE__*/_jsxs("div", {
                children: [
                  /*#__PURE__*/_jsx("h3", {
                    className: "text-base font-bold text-white",
                    children: "จัดการกิจกรรมชมรมวิชาชีพ / ลูกเสือ"
                  }),
                  /*#__PURE__*/_jsxs("p", {
                    className: "text-xs text-amber-200/90 mt-0.5",
                    children: [
                      "กำหนดครั้งที่จัดกิจกรรมชมรมสำหรับภาคเรียนที่ ",
                      semester, "/", academicYear,
                      " พร้อมสวิตช์เปิด-ปิดให้ครูบันทึกเช็คชื่อ"
                    ]
                  })
                ]
              })
            ]
          }),
          /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2 self-start sm:self-auto",
            children: [
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: loadClubSessions,
                disabled: loading || actionLoading,
                className: "px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-xs border border-white/20",
                children: [
                  /*#__PURE__*/_jsx(Icon.Refresh, { className: "w-3.5 h-3.5" }),
                  "รีเฟรชข้อมูล"
                ]
              }),
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: () => {
                  setEditingSession(null);
                  setSessionNo(clubSessionsList.length + 1);
                  setSessionTitle(`กิจกรรมชมรม ครั้งที่ ${clubSessionsList.length + 1}`);
                  setSessionDate('');
                  setSessionDescription('');
                  setIsModalOpen(true);
                },
                className: "px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border border-amber-500",
                children: [
                  /*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }),
                  "+ เพิ่มครั้งที่จัดชมรม"
                ]
              })
            ]
          })
        ]
      }),

      /* Content Area */
      loading ? /*#__PURE__*/_jsxs("div", {
        className: "p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-xs",
        children: [/*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-amber-600" }), "กำลังโหลดข้อมูลกิจกรรมชมรม..."]
      }) : /*#__PURE__*/_jsxs("div", {
        className: "space-y-3",
        children: [
          /* Header Info Bar */
          /*#__PURE__*/_jsxs("div", {
            className: "flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs",
            children: [
              /*#__PURE__*/_jsxs("div", {
                className: "text-xs text-slate-600",
                children: [
                  "กิจกรรมชมรมในภาคเรียนที่ ",
                  /*#__PURE__*/_jsxs("strong", { className: "text-amber-800 font-mono", children: [semester, "/", academicYear] }),
                  " (กำหนดไว้ทั้งหมด ", clubSessionsList.length, " ครั้ง)"
                ]
              }),
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: () => {
                  setEditingSession(null);
                  setSessionNo(clubSessionsList.length + 1);
                  setSessionTitle(`กิจกรรมชมรม ครั้งที่ ${clubSessionsList.length + 1}`);
                  setSessionDate('');
                  setSessionDescription('');
                  setIsModalOpen(true);
                },
                className: "px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                children: [
                  /*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }),
                  "เพิ่มครั้งใหม่"
                ]
              })
            ]
          }),

          /* Table or Empty */
          clubSessionsList.length === 0 ? /*#__PURE__*/_jsxs("div", {
            className: "p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3",
            children: [
              /*#__PURE__*/_jsx("div", { className: "text-3xl", children: "🏕️" }),
              /*#__PURE__*/_jsxs("h4", { className: "text-sm font-bold text-slate-800", children: ["ยังไม่มีการกำหนดครั้งกิจกรรมชมรมในภาคเรียนที่ ", semester, "/", academicYear] }),
              /*#__PURE__*/_jsx("p", { className: "text-xs text-slate-400", children: "กดปุ่ม \"+ เพิ่มครั้งที่จัดชมรม\" ด้านบนเพื่อกำหนดครั้งที่ 1, 2, 3... และเปิดให้ครูเช็คชื่อ" })
            ]
          }) : /*#__PURE__*/_jsx("div", {
            className: "bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs overflow-x-auto custom-scroll",
            children: /*#__PURE__*/_jsxs("table", {
              className: "w-full text-left border-collapse text-xs",
              children: [
                /*#__PURE__*/_jsx("thead", {
                  className: "bg-slate-50 border-b border-slate-200 text-slate-600 font-bold",
                  children: /*#__PURE__*/_jsxs("tr", {
                    children: [
                      /*#__PURE__*/_jsx("th", { className: "p-3 w-16 text-center", children: "ครั้งที่" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3", children: "ชื่อกิจกรรม / หัวข้อชมรม" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3 w-36 text-center", children: "สถานะการเปิดเช็คชื่อ" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3 w-32", children: "วันที่จัด" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3 w-28 text-right pr-4", children: "จัดการ" })
                    ]
                  })
                }),
                /*#__PURE__*/_jsx("tbody", {
                  className: "divide-y divide-slate-100",
                  children: clubSessionsList.map(session => {
                    const isOpen = Boolean(session.is_open);
                    return /*#__PURE__*/_jsxs("tr", {
                      className: "hover:bg-slate-50/80 transition-colors",
                      children: [
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3 text-center",
                          children: /*#__PURE__*/_jsx("span", {
                            className: "w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-mono font-black inline-flex items-center justify-center border border-amber-300",
                            children: session.session_no
                          })
                        }),
                        /*#__PURE__*/_jsxs("td", {
                          className: "p-3 font-semibold text-slate-800",
                          children: [
                            /*#__PURE__*/_jsx("div", { className: "font-bold text-slate-900 text-sm", children: session.title }),
                            session.description && /*#__PURE__*/_jsx("div", {
                              className: "text-[11px] text-slate-500 line-clamp-1 mt-0.5",
                              children: session.description
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3 text-center",
                          children: /*#__PURE__*/_jsxs("button", {
                            type: "button",
                            onClick: () => handleToggleOpen(session.id),
                            title: isOpen ? "คลิกเพื่อปิดรับการเช็คชื่อชมรมครั้งนี้" : "คลิกเพื่อเปิดให้ครูที่ปรึกษาเช็คชื่อเข้าร่วม",
                            className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border ${
                              isOpen
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400/40'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                            }`,
                            children: [
                              /*#__PURE__*/_jsx("span", {
                                className: `w-2 h-2 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-slate-400'}`
                              }),
                              /*#__PURE__*/_jsx("span", {
                                children: isOpen ? "🟢 เปิดให้เช็คชื่อ" : "🔒 ปิด / ล็อกอยู่"
                              })
                            ]
                          })
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3 text-slate-600 font-mono",
                          children: session.date || 'ตามตาราง'
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3 text-right pr-4",
                          children: /*#__PURE__*/_jsxs("div", {
                            className: "flex items-center justify-end gap-1.5",
                            children: [
                              /*#__PURE__*/_jsx("button", {
                                type: "button",
                                onClick: () => {
                                  setEditingSession(session);
                                  setSessionNo(session.session_no || 1);
                                  setSessionTitle(session.title || '');
                                  setSessionDate(session.date || '');
                                  setSessionDescription(session.description || '');
                                  setIsModalOpen(true);
                                },
                                className: "px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors",
                                children: "แก้ไข"
                              }),
                              /*#__PURE__*/_jsx("button", {
                                type: "button",
                                onClick: () => handleDeleteSession(session),
                                disabled: actionLoading,
                                className: "px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                                children: "ลบ"
                              })
                            ]
                          })
                        })
                      ]
                    }, session.id);
                  })
                })
              ]
            })
          })
        ]
      }),

      /* Modal: Create / Edit Club Session */
      isModalOpen && /*#__PURE__*/_jsx("div", {
        className: "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4",
        onClick: () => setIsModalOpen(false),
        children: /*#__PURE__*/_jsxs("form", {
          onSubmit: handleSaveSession,
          className: "bg-white max-w-md w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col",
          onClick: e => e.stopPropagation(),
          children: [
            /*#__PURE__*/_jsxs("div", {
              className: "p-4 bg-gradient-to-r from-amber-900 to-slate-900 text-white flex items-center justify-between",
              children: [
                /*#__PURE__*/_jsx("h3", { className: "font-bold text-sm", children: editingSession ? 'แก้ไขกิจกรรมชมรม' : 'เพิ่มครั้งที่จัดกิจกรรมชมรม' }),
                /*#__PURE__*/_jsx("button", { type: "button", onClick: () => setIsModalOpen(false), className: "text-white/80 hover:text-white cursor-pointer", children: /*#__PURE__*/_jsx(Icon.Close, { className: "w-4 h-4" }) })
              ]
            }),
            /*#__PURE__*/_jsxs("div", {
              className: "p-5 space-y-3.5 text-xs",
              children: [
                /* Row: Session No & Date */
                /*#__PURE__*/_jsxs("div", {
                  className: "grid grid-cols-3 gap-2.5",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-1 col-span-1",
                      children: [
                        /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "ครั้งที่:" }),
                        /*#__PURE__*/_jsx("input", {
                          type: "number",
                          min: 1,
                          required: true,
                          value: sessionNo,
                          onChange: e => setSessionNo(e.target.value),
                          className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center focus:border-amber-500 focus:outline-none"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-1 col-span-2",
                      children: [
                        /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "วันที่จัดกิจกรรม:" }),
                        /*#__PURE__*/_jsx("input", {
                          type: "date",
                          value: sessionDate,
                          onChange: e => setSessionDate(e.target.value),
                          className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                        })
                      ]
                    })
                  ]
                }),

                /* Title */
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "ชื่อกิจกรรม / หัวข้อประจำครั้ง:" }),
                    /*#__PURE__*/_jsx("input", {
                      type: "text",
                      required: true,
                      value: sessionTitle,
                      onChange: e => setSessionTitle(e.target.value),
                      placeholder: "เช่น กิจกรรมชมรม ครั้งที่ 1 (ปฐมนิเทศชมรม)...",
                      className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                    })
                  ]
                }),

                /* Details */
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "รายละเอียดกิจกรรม / คำชี้แจง:" }),
                    /*#__PURE__*/_jsx("textarea", {
                      rows: 2,
                      value: sessionDescription,
                      onChange: e => setSessionDescription(e.target.value),
                      placeholder: "ระบุรายละเอียดกิจกรรม เช่น การฝึกปฏิบัติ, อบรมวิชาชีพ, ประเมินผลงาน...",
                      className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
                    })
                  ]
                })
              ]
            }),
            /*#__PURE__*/_jsxs("div", {
              className: "p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2",
              children: [
                /*#__PURE__*/_jsx("button", { type: "button", onClick: () => setIsModalOpen(false), className: "px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer", children: "ยกเลิก" }),
                /*#__PURE__*/_jsx("button", { type: "submit", disabled: saving, className: "px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50", children: saving ? "กำลังบันทึก..." : "💾 บันทึกครั้งชมรม" })
              ]
            })
          ]
        })
      })
    ]
  });
}


// COMPONENT: จัดการกิจกรรมกลางของวิทยาลัยในหน้าแอดมิน (Admin Activities Tab)
// ==========================================
function AdminRecheckTab({
  academicYear,
  semester,
  activities = [],
  openCentralActivityIds = [],
  onUpdateOpenCentralActivities,
  onRefreshParent
}) {
  const [loading, setLoading] = useState(true);
  const [activitiesList, setActivitiesList] = useState(() => (activities && activities.length > 0 ? activities : []));
  useEffect(() => {
    if (activities && activities.length > 0) {
      setActivitiesList(activities);
    }
  }, [activities]);
  const [openActIds, setOpenActIds] = useState(() => {
    if (openCentralActivityIds && openCentralActivityIds.length > 0) return openCentralActivityIds;
    try {
      const cached = localStorage.getItem('open_central_activities');
      return cached ? JSON.parse(cached) : [];
    } catch(e) {
      return [];
    }
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Modal สำหรับสร้าง/แก้ไขกิจกรรมกลาง
  const [isActModalOpen, setIsActModalOpen] = useState(false);
  const [editingAct, setEditingAct] = useState(null);
  const [actName, setActName] = useState('');
  const [actDate, setActDate] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [actDriveUrl, setActDriveUrl] = useState('');
  const [actScoutClash, setActScoutClash] = useState(false);
  const [savingAct, setSavingAct] = useState(false);
  const [activityMetaMap, setActivityMetaMap] = useState({});

  // โหลดรายการกิจกรรมกลาง และสถานะเปิด/ปิดการเช็คชื่อ แยกตามปีและเทอม
  const loadActivitiesData = useCallback(async () => {
    setLoading(true);
    try {
      const activeY = String(academicYear || '2569');
      const activeS = String(semester || '1');
      const [actsRes, settingsRes, sessionSysRes] = await Promise.all([
        dbAssembly.from('activities').select('*').order('id', { ascending: true }),
        dbAssembly.from('system_settings').select('*'),
        dbAssembly.from('attendance_checkin_sessions')
          .select('*')
          .eq('department', '__SYSTEM_SETTINGS__')
          .eq('class_level', '__CENTRAL_ACTIVITIES__')
          .eq('academic_year', activeY)
          .eq('semester', activeS)
          .limit(1)
          .catch(() => ({ data: [] }))
      ]);

      if (actsRes.error) throw actsRes.error;
      const allActs = (actsRes.data && actsRes.data.length > 0) ? actsRes.data : [];
      const termActs = allActs.filter(a => 
        String(a.academic_year) === activeY && String(a.semester) === activeS
      );
      setActivitiesList(termActs);

      let parsed = null;
      if (sessionSysRes && sessionSysRes.data && sessionSysRes.data.length > 0 && sessionSysRes.data[0].notes) {
        try {
          const p = JSON.parse(sessionSysRes.data[0].notes);
          if (Array.isArray(p)) parsed = p;
        } catch(e) {}
      }
      // Fallback สำหรับเทอม 1 ดั้งเดิม
      if (!parsed && activeS === '1') {
        const { data: legacySys } = await dbAssembly
          .from('attendance_checkin_sessions')
          .select('notes')
          .eq('department', '__SYSTEM_SETTINGS__')
          .eq('class_level', '__CENTRAL_ACTIVITIES__')
          .limit(1)
          .catch(() => ({ data: [] }));
        if (legacySys && legacySys.length > 0 && legacySys[0].notes) {
          try {
            const p = JSON.parse(legacySys[0].notes);
            if (Array.isArray(p)) parsed = p;
          } catch(e) {}
        }
      }
      if (!parsed && settingsRes.data && Array.isArray(settingsRes.data) && activeS === '1') {
        const settings = settingsRes.data;
        const openObj = settings.find(s => s.key === 'open_central_activities');
        const testObj = settings.find(s => s.key === 'test_audit_verified');
        const lineObj = settings.find(s => s.key === 'line_notification_settings');
        if (openObj?.value) {
          try { const p = JSON.parse(openObj.value); if (Array.isArray(p)) parsed = p; } catch(e){}
        }
        if (!parsed && testObj?.value) {
          try { const p = JSON.parse(testObj.value); if (Array.isArray(p)) parsed = p; } catch(e){}
        }
        if (!parsed && lineObj?.value) {
          try { const p = JSON.parse(lineObj.value); if (Array.isArray(p?.open_central_activities)) parsed = p.open_central_activities; } catch(e){}
        }
      }
      const finalOpenIds = Array.isArray(parsed) ? parsed : [];
      setOpenActIds(finalOpenIds);
      localStorage.setItem('open_central_activities', JSON.stringify(finalOpenIds));
      if (onUpdateOpenCentralActivities) onUpdateOpenCentralActivities(finalOpenIds);

      // โหลด metadata (วันที่ และ รายละเอียดกิจกรรมกลาง)
      try {
        const { data: metaRes } = await dbAssembly
          .from('attendance_checkin_sessions')
          .select('notes')
          .eq('department', '__SYSTEM_SETTINGS__')
          .eq('class_level', '__CENTRAL_ACTIVITIES_METADATA__')
          .eq('academic_year', activeY)
          .eq('semester', activeS)
          .limit(1);
        if (metaRes && metaRes.length > 0 && metaRes[0].notes) {
          const parsedMeta = JSON.parse(metaRes[0].notes);
          if (parsedMeta && typeof parsedMeta === 'object') {
            setActivityMetaMap(parsedMeta);
          }
        }
      } catch(metaErr) {
        console.warn('Load central activity metadata error:', metaErr);
      }
    } catch(err) {
      console.error('loadActivitiesData error:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester]);

  // สลับเปิด/ปิดให้ครูเช็คชื่อรายกิจกรรม (One-Click Toggle แยกตามเทอม)
  const handleToggleActivityOpen = async (actId) => {
    const actIdStr = String(actId);
    const isCurrentlyOpen = openActIds.includes(actIdStr);
    const nextOpenIds = isCurrentlyOpen
      ? openActIds.filter(id => id !== actIdStr)
      : [...openActIds, actIdStr];

    setOpenActIds(nextOpenIds);
    localStorage.setItem('open_central_activities', JSON.stringify(nextOpenIds));
    if (onUpdateOpenCentralActivities) onUpdateOpenCentralActivities(nextOpenIds);
    try {
      window.dispatchEvent(new CustomEvent('central_activities_changed', { detail: nextOpenIds }));
    } catch(_) {}

    try {
      const activeY = String(academicYear || '2569');
      const activeS = String(semester || '1');
      const { data: existingSys } = await dbAssembly
        .from('attendance_checkin_sessions')
        .select('id')
        .eq('department', '__SYSTEM_SETTINGS__')
        .eq('class_level', '__CENTRAL_ACTIVITIES__')
        .eq('academic_year', activeY)
        .eq('semester', activeS)
        .limit(1);

      if (existingSys && existingSys.length > 0) {
        await dbAssembly
          .from('attendance_checkin_sessions')
          .update({ notes: JSON.stringify(nextOpenIds), updated_at: new Date().toISOString() })
          .eq('id', existingSys[0].id);
      } else {
        await dbAssembly
          .from('attendance_checkin_sessions')
          .insert([{
            check_date: '2026-01-01',
            department: '__SYSTEM_SETTINGS__',
            class_level: '__CENTRAL_ACTIVITIES__',
            teacher_name: '__ADMIN__',
            academic_year: activeY,
            semester: activeS,
            notes: JSON.stringify(nextOpenIds)
          }]);
      }

      // สำรองข้อมูลลง system_settings ด้วย
      const token = sessionStorage.getItem('admin_session_token') || '';
      if (activeS === '1') {
        await dbAssembly.rpc('admin_save_system_setting_secure', {
          p_key: 'open_central_activities',
          p_value: JSON.stringify(nextOpenIds),
          p_auth_token_or_pin: token
        }).catch(() => {});
      }

      if (onRefreshParent) onRefreshParent();
    } catch(err) {
      console.warn('handleToggleActivityOpen DB error:', err);
    }
  };

  useEffect(() => {
    loadActivitiesData();
  }, [loadActivitiesData]);

  // บันทึกกิจกรรมกลาง (สร้างใหม่ หรือ แก้ไข)
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!actName.trim()) return alert('กรุณากรอกชื่อกิจกรรม');
    setSavingAct(true);
    try {
      const client = dbAssembly;

      const payload = {
        name: actName.trim(),
        drive_url: actDriveUrl.trim() || null,
        scout_clash: Boolean(actScoutClash),
        academic_year: String(academicYear || '2569'),
        semester: String(semester || '1')
      };

      let targetActId = editingAct ? editingAct.id : `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      if (editingAct) {
        const { error } = await client.from('activities').update(payload).eq('id', editingAct.id);
        if (error) throw error;
      } else {
        payload.id = targetActId;
        const { error } = await client.from('activities').insert([payload]);
        if (error) throw error;
      }

      // บันทึกวันที่ และรายละเอียดกิจกรรมกลางลง metadata
      try {
        const activeY = String(academicYear || '2569');
        const activeS = String(semester || '1');
        const nextMetaMap = {
          ...activityMetaMap,
          [targetActId]: {
            activity_date: actDate ? actDate.trim() : '',
            description: actDescription ? actDescription.trim() : ''
          }
        };
        setActivityMetaMap(nextMetaMap);

        const { data: existingMeta } = await client
          .from('attendance_checkin_sessions')
          .select('id')
          .eq('department', '__SYSTEM_SETTINGS__')
          .eq('class_level', '__CENTRAL_ACTIVITIES_METADATA__')
          .eq('academic_year', activeY)
          .eq('semester', activeS)
          .limit(1);

        if (existingMeta && existingMeta.length > 0) {
          await client
            .from('attendance_checkin_sessions')
            .update({ notes: JSON.stringify(nextMetaMap), updated_at: new Date().toISOString() })
            .eq('id', existingMeta[0].id);
        } else {
          await client
            .from('attendance_checkin_sessions')
            .insert([{
              check_date: '2026-01-01',
              department: '__SYSTEM_SETTINGS__',
              class_level: '__CENTRAL_ACTIVITIES_METADATA__',
              teacher_name: '__ADMIN__',
              academic_year: activeY,
              semester: activeS,
              notes: JSON.stringify(nextMetaMap)
            }]);
        }
      } catch(mErr) {
        console.warn('Save central activity metadata warning:', mErr);
      }

      alert(editingAct ? 'แก้ไขข้อมูลกิจกรรมกลางเรียบร้อย' : 'เพิ่มกิจกรรมกลางใหม่เรียบร้อย');
      setIsActModalOpen(false);
      setEditingAct(null);
      await loadActivitiesData();
      if (onRefreshParent) onRefreshParent();
    } catch(err) {
      alert('บันทึกกิจกรรมล้มเหลว: ' + err.message);
    } finally {
      setSavingAct(false);
    }
  };

  // ลบกิจกรรมกลาง
  const handleDeleteActivity = async (act) => {
    if (!confirm(`ต้องการลบกิจกรรม "${act.name}" หรือไม่?\n(ประวัติการเช็คชื่อของกิจกรรมนี้อาจถูกลบด้วย)`)) return;
    setActionLoading(true);
    try {
      const client = dbAssembly;
      const { error } = await client.from('activities').delete().eq('id', act.id);
      if (error) throw error;
      alert(`ลบกิจกรรม "${act.name}" สำเร็จ`);
      await loadActivitiesData();
      if (onRefreshParent) onRefreshParent();
    } catch(err) {
      alert('ลบกิจกรรมล้มเหลว: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return /*#__PURE__*/_jsxs("div", {
    className: "space-y-4",
    children: [
      /* Top Banner */
      /*#__PURE__*/_jsxs("div", {
        className: "p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-800/80",
        children: [
          /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-3",
            children: [
              /*#__PURE__*/_jsx("div", {
                className: "w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl flex-shrink-0 border border-indigo-400/30",
                children: /*#__PURE__*/_jsx(Icon.Academic, { className: "w-6 h-6 text-indigo-300" })
              }),
              /*#__PURE__*/_jsxs("div", {
                children: [
                  /*#__PURE__*/_jsx("h3", {
                    className: "text-base font-bold text-white",
                    children: "จัดการกิจกรรมกลางของวิทยาลัย"
                  }),
                  /*#__PURE__*/_jsxs("p", {
                    className: "text-xs text-indigo-200/90 mt-0.5",
                    children: [
                      "กำหนดรายชื่อกิจกรรมกลางสำหรับภาคเรียนที่ ",
                      semester, "/", academicYear,
                      " (ครูที่ปรึกษาจะเป็นผู้เช็คชื่อเข้าร่วมในระบบ)"
                    ]
                  })
                ]
              })
            ]
          }),
          /*#__PURE__*/_jsxs("div", {
            className: "flex items-center gap-2 self-start sm:self-auto",
            children: [
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: loadActivitiesData,
                disabled: loading || actionLoading,
                className: "px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-xs border border-white/20",
                children: [
                  /*#__PURE__*/_jsx(Icon.Refresh, { className: "w-3.5 h-3.5" }),
                  "รีเฟรชข้อมูล"
                ]
              }),
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: () => {
                  setEditingAct(null);
                  setActName('');
                  setActDate('');
                  setActDescription('');
                  setActDriveUrl('');
                  setActScoutClash(false);
                  setIsActModalOpen(true);
                },
                className: "px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border border-indigo-500",
                children: [
                  /*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }),
                  "+ เพิ่มกิจกรรมใหม่"
                ]
              })
            ]
          })
        ]
      }),

      /* Content Area */
      loading ? /*#__PURE__*/_jsxs("div", {
        className: "p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-xs",
        children: [/*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-indigo-600" }), "กำลังโหลดข้อมูลกิจกรรมกลาง..."]
      }) : /*#__PURE__*/_jsxs("div", {
        className: "space-y-3",
        children: [
          /* Header Info Bar */
          /*#__PURE__*/_jsxs("div", {
            className: "flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs",
            children: [
              /*#__PURE__*/_jsxs("div", {
                className: "text-xs text-slate-600",
                children: [
                  "กิจกรรมกลางในภาคเรียนที่ ",
                  /*#__PURE__*/_jsxs("strong", { className: "text-indigo-800 font-mono", children: [semester, "/", academicYear] }),
                  " (พบทั้งหมด ", activitiesList.length, " กิจกรรม)"
                ]
              }),
              /*#__PURE__*/_jsxs("button", {
                type: "button",
                onClick: () => {
                  setEditingAct(null);
                  setActName('');
                  setActDate('');
                  setActDescription('');
                  setActDriveUrl('');
                  setActScoutClash(false);
                  setIsActModalOpen(true);
                },
                className: "px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                children: [
                  /*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }),
                  "สร้างกิจกรรม"
                ]
              })
            ]
          }),

          /* Table or Empty */
          activitiesList.length === 0 ? /*#__PURE__*/_jsxs("div", {
            className: "p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3",
            children: [
              /*#__PURE__*/_jsx("div", { className: "text-3xl", children: "📋" }),
              /*#__PURE__*/_jsxs("h4", { className: "text-sm font-bold text-slate-800", children: ["ยังไม่มีกิจกรรมกลางในภาคเรียนที่ ", semester, "/", academicYear] }),
              /*#__PURE__*/_jsx("p", { className: "text-xs text-slate-400", children: "กดปุ่ม \"+ เพิ่มกิจกรรมใหม่\" ด้านบนเพื่อเริ่มต้นสร้างกิจกรรมกลางสำหรับภาคเรียนนี้" }),
              /*#__PURE__*/_jsx("div", {
                className: "pt-2",
                children: /*#__PURE__*/_jsxs("button", {
                  type: "button",
                  onClick: () => {
                    setEditingAct(null);
                    setActName('');
                    setActDriveUrl('');
                    setActScoutClash(false);
                    setIsActModalOpen(true);
                  },
                  className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs",
                  children: [
                    /*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }),
                    "+ เพิ่มกิจกรรมใหม่"
                  ]
                })
              })
            ]
          }) : /*#__PURE__*/_jsx("div", {
            className: "bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs",
            children: /*#__PURE__*/_jsxs("table", {
              className: "w-full text-left border-collapse text-xs",
              children: [
                /*#__PURE__*/_jsx("thead", {
                  children: /*#__PURE__*/_jsxs("tr", {
                    className: "bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]",
                    children: [
                      /*#__PURE__*/_jsx("th", { className: "p-3 w-12 text-center", children: "ลำดับ" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3", children: "ชื่อกิจกรรมกลาง" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3 text-center min-w-[150px]", children: "สถานะเปิด/ปิดเช็คชื่อ" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3", children: "ภาคเรียน" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3", children: "เงื่อนไขพิเศษ" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3", children: "คลังภาพ (Drive)" }),
                      /*#__PURE__*/_jsx("th", { className: "p-3 text-right pr-4", children: "การจัดการ" })
                    ]
                  })
                }),
                /*#__PURE__*/_jsx("tbody", {
                  className: "divide-y divide-slate-100",
                  children: activitiesList.map((act, aIdx) => {
                    const isOpen = openActIds.includes(String(act.id));
                    return /*#__PURE__*/_jsxs("tr", {
                      className: "hover:bg-slate-50/80 transition-colors",
                      children: [
                        /*#__PURE__*/_jsx("td", { className: "p-3 text-center font-mono text-slate-400", children: aIdx + 1 }),
                        /*#__PURE__*/_jsx("td", { className: "p-3 font-bold text-slate-900", children: act.name }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3 text-center",
                          children: /*#__PURE__*/_jsxs("button", {
                            type: "button",
                            onClick: () => handleToggleActivityOpen(act.id),
                            title: isOpen ? "คลิกเพื่อปิดรับการเช็คชื่อ (ล็อกระบบ)" : "คลิกเพื่อเปิดให้ครูที่ปรึกษาเช็คชื่อเข้าร่วม",
                            className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border ${
                              isOpen 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400/40' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                            }`,
                            children: [
                              /*#__PURE__*/_jsx("span", {
                                className: `w-2 h-2 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-slate-400'}`
                              }),
                              /*#__PURE__*/_jsx("span", {
                                children: isOpen ? "🟢 เปิดให้เช็คชื่อ" : "🔒 ปิด / ล็อกอยู่"
                              })
                            ]
                          })
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3",
                          children: /*#__PURE__*/_jsxs("span", {
                            className: "px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700",
                            children: [act.semester || semester, "/", act.academic_year || academicYear]
                          })
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3",
                          children: act.scout_clash
                            ? /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200", children: "🏕️ ชนลูกเสือ" })
                            : /*#__PURE__*/_jsx("span", { className: "text-slate-400", children: "ปกติ" })
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3",
                          children: act.drive_url ? (
                            /*#__PURE__*/_jsxs("a", {
                              href: act.drive_url,
                              target: "_blank",
                              rel: "noopener noreferrer",
                              className: "inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 underline",
                              children: [/*#__PURE__*/_jsx(Icon.ExternalLink, { className: "w-3 h-3" }), "คลังภาพ"]
                            })
                          ) : /*#__PURE__*/_jsx("span", { className: "text-slate-400", children: "-" })
                        }),
                        /*#__PURE__*/_jsx("td", {
                          className: "p-3 text-right pr-4",
                          children: /*#__PURE__*/_jsxs("div", {
                            className: "flex items-center justify-end gap-1.5",
                            children: [
                              /*#__PURE__*/_jsx("button", {
                                type: "button",
                                onClick: () => {
                                  setEditingAct(act);
                                  setActName(act.name || '');
                                  setActDate(activityMetaMap[act.id]?.activity_date || '');
                                  setActDescription(activityMetaMap[act.id]?.description || '');
                                  setActDriveUrl(act.drive_url || '');
                                  setActScoutClash(Boolean(act.scout_clash));
                                  setIsActModalOpen(true);
                                },
                                className: "px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors",
                                children: "แก้ไข"
                              }),
                              /*#__PURE__*/_jsx("button", {
                                type: "button",
                                onClick: () => handleDeleteActivity(act),
                                disabled: actionLoading,
                                className: "px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                                children: "ลบ"
                              })
                            ]
                          })
                        })
                      ]
                    });
                  })
                })
              ]
            })
          })
        ]
      }),

      /* Modal: Create / Edit Activity */
      isActModalOpen && /*#__PURE__*/_jsx("div", {
        className: "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4",
        onClick: () => setIsActModalOpen(false),
        children: /*#__PURE__*/_jsxs("form", {
          onSubmit: handleSaveActivity,
          className: "bg-white max-w-md w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col",
          onClick: e => e.stopPropagation(),
          children: [
            /*#__PURE__*/_jsxs("div", {
              className: "p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between",
              children: [
                /*#__PURE__*/_jsx("h3", { className: "font-bold text-sm", children: editingAct ? 'แก้ไขกิจกรรมกลาง' : 'เพิ่มกิจกรรมกลางใหม่' }),
                /*#__PURE__*/_jsx("button", { type: "button", onClick: () => setIsActModalOpen(false), className: "text-white/80 hover:text-white cursor-pointer", children: /*#__PURE__*/_jsx(Icon.Close, { className: "w-4 h-4" }) })
              ]
            }),
            /*#__PURE__*/_jsxs("div", {
              className: "p-5 space-y-3.5 text-xs",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "ชื่อกิจกรรมกลาง:" }),
                    /*#__PURE__*/_jsx("input", {
                      type: "text",
                      required: true,
                      value: actName,
                      onChange: e => setActName(e.target.value),
                      placeholder: "เช่น กิจกรรมวันไหว้ครู, ปฐมนิเทศ, พิธีเฉลิมพระเกียรติ...",
                      className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                    })
                  ]
                }),
                /*#__PURE__*/_jsxs("div", {
                  className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-1",
                      children: [
                        /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "วันที่จัดกิจกรรม:" }),
                        /*#__PURE__*/_jsx("input", {
                          type: "date",
                          value: actDate,
                          onChange: e => setActDate(e.target.value),
                          className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-1",
                      children: [
                        /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "ลิงก์ Google Drive คลังภาพ (ถ้ามี):" }),
                        /*#__PURE__*/_jsx("input", {
                          type: "url",
                          value: actDriveUrl,
                          onChange: e => setActDriveUrl(e.target.value),
                          placeholder: "https://drive.google.com/...",
                          className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                        })
                      ]
                    })
                  ]
                }),
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("label", { className: "font-bold text-slate-700 block", children: "รายละเอียดกิจกรรม / วัตถุประสงค์:" }),
                    /*#__PURE__*/_jsx("textarea", {
                      rows: 2,
                      value: actDescription,
                      onChange: e => setActDescription(e.target.value),
                      placeholder: "ระบุรายละเอียดกิจกรรม เช่น สถานที่จัด, กำหนดการ, หรือข้อปฏิบัติของนักเรียน...",
                      className: "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    })
                  ]
                }),
/* scout_clash checkbox removed */
              ]
            }),
            /*#__PURE__*/_jsxs("div", {
              className: "p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2",
              children: [
                /*#__PURE__*/_jsx("button", { type: "button", onClick: () => setIsActModalOpen(false), className: "px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer", children: "ยกเลิก" }),
                /*#__PURE__*/_jsx("button", { type: "submit", disabled: savingAct, className: "px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50", children: savingAct ? "กำลังบันทึก..." : "💾 บันทึกกิจกรรม" })
              ]
            })
          ]
        })
      })
    ]
  });
}

// ==========================================
// MODAL: Admin Panel (Expanded with Logs & Drive)
// ==========================================
function AdminPanelModal({
  studentPhotosMap,
  studentCodesMap = {},
  onSaveStudentCode,
  onSaveStudentPhoto,
  onOpenStudentPhoto,
  baseTotalDays,
  onSaveDays,
  rules,
  onSaveRules,
  academicYear,
  semester,
  availableAcademicYears,
  onAddAcademicYear,
  termStartDate,
  termEndDate,
  termSchedules,
  onUpdateTermSchedules,
  specialHolidays,
  compensatoryDays,
  calendarStats,
  isCalendarEnabled,
  onSaveCalendarEnabled,
  onSaveCalendarSettings,
  onOpenCalendarModal,
  onSaveAcademicTerm,
  teachersList,
  teacherPhotosMap = {},
  onOpenTeacherPhoto,
  onUpdateTeachers,
  onUpdateStudents,
  sessions,
  lineSettings = {},
  onSaveLineSettings,
  allowOffHoursCheckin = false,
  onToggleOffHoursCheckin,
  masterStudents = [],
  hiddenClassLevels = [],
  onSaveHiddenClassLevels,
  activities = [],
  openCentralActivityIds = [],
  onUpdateOpenCentralActivities,
  onLogout,
  reloadData,
  onClose
}) {
  
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.classList.remove('modal-open');
    };
  }, []);
const [adminTab, setAdminTab] = useState('term'); // 'term', 'students', 'logs', 'teachers', 'general', 'storage', 'line'
  const [days, setDays] = useState(baseTotalDays);
  const [ruleList, setRuleList] = useState(rules);
  const [localHiddenLevels, setLocalHiddenLevels] = useState(hiddenClassLevels || []);
  const [savingHiddenLevels, setSavingHiddenLevels] = useState(false);

  useEffect(() => {
    setLocalHiddenLevels(hiddenClassLevels || []);
  }, [hiddenClassLevels]);

  const handleToggleHideLevel = async (levelName) => {
    const isCurrentlyHidden = localHiddenLevels.includes(levelName);
    const updated = isCurrentlyHidden 
      ? localHiddenLevels.filter(lvl => lvl !== levelName)
      : [...localHiddenLevels, levelName];
    setLocalHiddenLevels(updated);
    setSavingHiddenLevels(true);
    try {
      if (onSaveHiddenClassLevels) {
        await onSaveHiddenClassLevels(updated);
      }
    } catch(err) {
      console.error('Failed to toggle hidden level:', err);
      alert('บันทึกการซ่อนชั้นปีไม่สำเร็จ: ' + (err.message || err));
      setLocalHiddenLevels(localHiddenLevels);
    } finally {
      setSavingHiddenLevels(false);
    }
  };
  const [localAllowOffHours, setLocalAllowOffHours] = useState(Boolean(allowOffHoursCheckin));
  const [savingOffHours, setSavingOffHours] = useState(false);

  useEffect(() => {
    setLocalAllowOffHours(Boolean(allowOffHoursCheckin));
  }, [allowOffHoursCheckin]);

  const handleToggleOffHours = async (checked) => {
    setLocalAllowOffHours(checked);
    setSavingOffHours(true);
    try {
      if (onToggleOffHoursCheckin) {
        await onToggleOffHoursCheckin(checked);
      }
    } catch (err) {
      alert('เปลี่ยนการตั้งค่าเช็คชื่อนอกเวลาล้มเหลว: ' + (err.message || err));
      setLocalAllowOffHours(!checked);
    } finally {
      setSavingOffHours(false);
    }
  };
  const [availableYears, setAvailableYears] = useState(availableAcademicYears || ['2569', '2568', '2567']);
  const [adminYear, setAdminYear] = useState(() => localStorage.getItem('admin_working_year') || academicYear || '2569');
  const [adminSem, setAdminSem] = useState(() => localStorage.getItem('admin_working_sem') || semester || '1');
  const handleAdminSemChange = useCallback((newSem) => {
    setAdminSem(newSem);
    localStorage.setItem('admin_working_sem', newSem);
  }, []);
  const handleAdminYearChange = useCallback((newYear) => {
    setAdminYear(newYear);
    localStorage.setItem('admin_working_year', newYear);
  }, []);
  const [adminEnableCalendar, setAdminEnableCalendar] = useState(Boolean(isCalendarEnabled));
  // Helper: หาหรือสร้างค่าเริ่มต้นวันเปิด-ปิดและเกณฑ์วันของเทอมนั้นๆ
  const getDatesForTerm = useCallback((yr, sem) => {
    const key = `${yr}_${sem}`;
    if (termSchedules && termSchedules[key]?.startDate) {
      return termSchedules[key];
    }
    if (String(yr) === String(academicYear) && String(sem) === String(semester) && termStartDate) {
      return {
        startDate: termStartDate,
        endDate: termEndDate || '',
        useFixedDays: false,
        fixedDays: baseTotalDays || 65
      };
    }
    const adYear = Number(yr) > 2500 ? Number(yr) - 543 : 2026;
    if (String(sem) === '1') {
      return { startDate: `${adYear}-05-18`, endDate: `${adYear}-10-10`, useFixedDays: false, fixedDays: 65 };
    } else {
      return { startDate: `${adYear}-11-01`, endDate: `${adYear + 1}-03-15`, useFixedDays: false, fixedDays: 96 };
    }
  }, [termSchedules, academicYear, semester, termStartDate, termEndDate, baseTotalDays]);

  const initialDates = getDatesForTerm(academicYear || '2569', semester || '1');
  const [adminStartDate, setAdminStartDate] = useState(initialDates.startDate || termStartDate || '2026-05-18');
  const [adminEndDate, setAdminEndDate] = useState(initialDates.endDate || termEndDate || '2026-10-10');
  const [adminUseFixedDays, setAdminUseFixedDays] = useState(Boolean(initialDates.useFixedDays));
  const [adminFixedDays, setAdminFixedDays] = useState(initialDates.fixedDays ? Number(initialDates.fixedDays) : 65);
  const [savingDays, setSavingDays] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);

  useEffect(() => {
    if (availableAcademicYears) setAvailableYears(availableAcademicYears);
  }, [availableAcademicYears]);

  // โหลดค่าใหม่เฉพาะเมื่อแอดมินคลิกสลับ dropdown ปีหรือเทอมเท่านั้น (ป้องกันการ reset ค่าที่แอดมินกำลังแก้ไข)
  const prevTermKeyRef = useRef(`${academicYear || '2569'}_${semester || '1'}`);
  useEffect(() => {
    const currentKey = `${adminYear}_${adminSem}`;
    if (prevTermKeyRef.current !== currentKey) {
      prevTermKeyRef.current = currentKey;
      const dates = getDatesForTerm(adminYear, adminSem);
      setAdminStartDate(dates.startDate);
      setAdminEndDate(dates.endDate || '');
      setAdminUseFixedDays(Boolean(dates.useFixedDays));
      setAdminFixedDays(dates.fixedDays ? Number(dates.fixedDays) : 65);
    }
  }, [adminYear, adminSem, getDatesForTerm]);

  const adminLiveStats = useMemo(() => {
    return calculateSchoolDaysStats(adminStartDate, adminEndDate, specialHolidays, compensatoryDays);
  }, [adminStartDate, adminEndDate, specialHolidays, compensatoryDays]);

  const handleAddNewYearPrompt = async () => {
    const input = prompt('กรุณากรอกปีการศึกษา พ.ศ. ใหม่ เช่น 2570, 2571:');
    if (!input) return;
    const cleanYear = input.trim();
    if (!/^\d{4}$/.test(cleanYear)) {
      alert('กรุณากรอกปีการศึกษาเป็นตัวเลข พ.ศ. 4 หลัก เช่น 2570');
      return;
    }
    const updated = Array.from(new Set([cleanYear, ...availableYears])).sort((a, b) => Number(b) - Number(a));
    setAvailableYears(updated);
    setAdminYear(cleanYear);
    if (onAddAcademicYear) {
      await onAddAcademicYear(cleanYear);
    }
  };

  // Storage Quota & Cleanup State
  const [storageStats, setStorageStats] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [cleaningTerm, setCleaningTerm] = useState(null);

  const storageUsedMb = storageStats?.estimated_photo_mb || 0;
  const storageMaxMb = storageStats?.max_storage_mb || 500;
  const storagePct = Math.min(100, Math.round((storageUsedMb / storageMaxMb) * 100));
  const storageBarColor = storagePct >= 80 ? 'bg-rose-500' : storagePct >= 60 ? 'bg-amber-400' : 'bg-emerald-400';
  const storageStatusColor = storagePct >= 80 ? 'text-rose-400' : storagePct >= 60 ? 'text-amber-300' : 'text-emerald-300';

  const fetchStorageStats = async () => {
    setLoadingStorage(true);
    try {
      const { data, error } = await dbAssembly.rpc('admin_get_storage_stats');
      if (!error && data && data.success) {
        setStorageStats(data);
        return;
      }
    } catch (e) {
      console.warn('RPC admin_get_storage_stats error, using query fallback', e);
    }

    try {
      const [summaryRes, sessionsRes] = await Promise.all([
        fetchAllRows(dbAssembly, 'attendance_summary', 'id, academic_year, semester'),
        fetchAllRows(dbAssembly, 'attendance_checkin_sessions', 'id, academic_year, semester, evidence_photo_url')
      ]);
      const totalStudents = summaryRes.length;
      const totalSessions = sessionsRes.length;
      const photos = sessionsRes.filter(s => s.evidence_photo_url && s.evidence_photo_url.length > 50);
      const totalPhotos = photos.length;
      const estimatedMb = Number(((totalPhotos * 180) / 1024).toFixed(2));

      const termsMap = {};
      summaryRes.forEach(s => {
        const y = String(s.academic_year || '2569');
        const sm = String(s.semester || '1');
        const key = sm + '/' + y;
        if (!termsMap[key]) termsMap[key] = { academic_year: y, semester: sm, student_count: 0, session_count: 0, photo_count: 0 };
        termsMap[key].student_count++;
      });
      sessionsRes.forEach(s => {
        const y = String(s.academic_year || '2569');
        const sm = String(s.semester || '1');
        const key = sm + '/' + y;
        if (!termsMap[key]) termsMap[key] = { academic_year: y, semester: sm, student_count: 0, session_count: 0, photo_count: 0 };
        termsMap[key].session_count++;
        if (s.evidence_photo_url && s.evidence_photo_url.length > 50) {
          termsMap[key].photo_count++;
        }
      });

      const activeKey = adminSem + '/' + adminYear;
      if (!termsMap[activeKey]) {
        termsMap[activeKey] = { academic_year: adminYear, semester: adminSem, student_count: 0, session_count: 0, photo_count: 0 };
      }

      const terms = Object.values(termsMap).map(t => ({
        ...t,
        is_active: String(t.academic_year) === String(adminYear) && String(t.semester) === String(adminSem)
      })).sort((a, b) => b.academic_year.localeCompare(a.academic_year) || b.semester.localeCompare(a.semester));

      setStorageStats({
        success: true,
        active_term: { year: adminYear, semester: adminSem },
        total_students: totalStudents,
        total_sessions: totalSessions,
        total_photos: totalPhotos,
        estimated_photo_mb: estimatedMb,
        max_storage_mb: 500,
        terms
      });
    } catch (err) {
      console.error('Storage stats fallback failed:', err);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'storage') {
      fetchStorageStats();
    }
  }, [adminTab]);

  const handleCleanupTerm = async (targetYear, targetSem, mode) => {
    const isProtected = (String(targetYear) > String(academicYear)) || 
      (String(targetYear) === String(academicYear) && Number(targetSem) >= Number(semester)) ||
      (String(targetYear) === String(adminYear) && String(targetSem) === String(adminSem));
    if (isProtected) {
      alert('ระบบความปลอดภัย: ไม่อนุญาตให้ล้างข้อมูลของภาคเรียนที่ ' + targetSem + '/' + targetYear + ' (เนื่องจากเป็นภาคเรียนปัจจุบัน หรือภาคเรียนที่เตรียมไว้ล่วงหน้า)');
      return;
    }

    if (mode === 'photos_only') {
      const confirmMsg = 'ยืนยันล้างเฉพาะรูปถ่ายหลักฐานของภาคเรียนที่ ' + targetSem + '/' + targetYear + '?\n\n' +
        '• รูปถ่ายหลักฐานทั้งหมดจะถูกลบออกจากฐานข้อมูลเพื่อคืนพื้นที่ (ประหยัดพื้นที่ ~95%)\n' +
        '• ข้อมูลสถิติ วันมาแถว ร้อยละ และสถานะของนักเรียนจะยังคงอยู่ครบถ้วน\n\n' +
        'ต้องการดำเนินการต่อหรือไม่?';
      if (!window.confirm(confirmMsg)) return;
    } else if (mode === 'purge_all') {
      const confirmPrompt = prompt('คำเตือนความปลอดภัยสูงสุด: คุณกำลังจะลบประวัติของภาคเรียนที่ ' + targetSem + '/' + targetYear + ' ทั้งหมดอย่างถาวร!\n\nข้อมูลทั้งรอบเช็คชื่อและรายชื่อนักเรียนจะหายไปและไม่สามารถกู้คืนได้\n\nพิมพ์คำว่า "DELETE" เพื่อยืนยัน:');
      if (confirmPrompt !== 'DELETE') {
        alert('ยกเลิกการลบข้อมูล');
        return;
      }
    }

    setCleaningTerm(targetSem + '/' + targetYear + '-' + mode);
    try {
      const token = sessionStorage.getItem('admin_session_token') || '';
      const { data, error } = await dbAssembly.rpc('admin_cleanup_old_term', {
        p_target_year: String(targetYear),
        p_target_sem: String(targetSem),
        p_cleanup_mode: mode,
        p_auth_token_or_pin: token
      });

      if (!error && data && data.success) {
        alert(data.message || 'ดำเนินการสำเร็จ');
        await fetchStorageStats();
        return;
      }

      // Fallback direct cleanup
      if (mode === 'photos_only') {
        const { error: upErr } = await dbAssembly
          .from('attendance_checkin_sessions')
          .update({ evidence_photo_url: null })
          .match({ academic_year: targetYear, semester: targetSem });
        if (upErr) throw upErr;
        alert('ล้างเฉพาะรูปถ่ายหลักฐานของภาคเรียนที่ ' + targetSem + '/' + targetYear + ' สำเร็จแล้ว (สถิติการมาแถวยังอยู่ครบ)');
      } else {
        await dbAssembly.from('attendance_checkin_sessions').delete().match({ academic_year: targetYear, semester: targetSem });
        await dbAssembly.from('attendance_summary').delete().match({ academic_year: targetYear, semester: targetSem });
        alert('ลบประวัติของภาคเรียนที่ ' + targetSem + '/' + targetYear + ' สำเร็จแล้ว');
      }
      await fetchStorageStats();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message);
    } finally {
      setCleaningTerm(null);
    }
  };

  // Full Backup & Restore State & Handlers
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const backupFileInputRef = useRef(null);

  const handleExportFullBackup = async () => {
    setIsExportingBackup(true);
    try {
      const [
        summaryRes,
        dailyRes,
        sessionsRes,
        teachersRes,
        settingsRes,
        rulesRes
      ] = await Promise.all([
        fetchAllRows(dbAssembly, 'attendance_summary', '*').catch(() => []),
        fetchAllRows(dbAssembly, 'daily_attendance', '*').catch(() => []),
        fetchAllRows(dbAssembly, 'attendance_checkin_sessions', '*').catch(() => []),
        fetchAllRows(dbAssembly, 'teachers', '*').catch(() => []),
        fetchAllRows(dbAssembly, 'system_settings', '*').catch(() => []),
        fetchAllRows(dbAssembly, 'system_rules', '*').catch(() => [])
      ]);

      const backupObj = {
        app: 'DAN_SAI_ATTENDANCE_SYSTEM',
        version: '2.0',
        exported_at: new Date().toISOString(),
        college: 'วิทยาลัยการอาชีพด่านซ้าย',
        summary: {
          attendance_summary_count: (summaryRes || []).length,
          daily_attendance_count: (dailyRes || []).length,
          attendance_checkin_sessions_count: (sessionsRes || []).length,
          teachers_count: (teachersRes || []).length,
          settings_count: (settingsRes || []).length
        },
        data: {
          attendance_summary: summaryRes || [],
          daily_attendance: dailyRes || [],
          attendance_checkin_sessions: sessionsRes || [],
          teachers: teachersRes || [],
          system_settings: settingsRes || [],
          system_rules: rulesRes || []
        }
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      a.href = url;
      a.download = `backup_dansai_attendance_full_${datePart}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`✅ สำรองข้อมูลทั้งหมดเรียบร้อยแล้ว!\n\n• นักเรียน (attendance_summary): ${(summaryRes || []).length} คน\n• ประวัติเช็คชื่อรายวัน (daily_attendance): ${(dailyRes || []).length} รายการ\n• รอบเช็คชื่อ & ภาพถ่าย (attendance_checkin_sessions): ${(sessionsRes || []).length} รอบ\n• ครูที่ปรึกษา: ${(teachersRes || []).length} คน\n\nดาวน์โหลดไฟล์ JSON สำเร็จ`);
    } catch (err) {
      console.error('Backup error:', err);
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + (err.message || err));
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreFullBackup = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsRestoringBackup(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !parsed.data) {
        throw new Error('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง (ไม่พบโครงสร้าง data)');
      }

      const d = parsed.data;
      const summCount = (d.attendance_summary || []).length;
      const dailyCount = (d.daily_attendance || []).length;
      const sessCount = (d.attendance_checkin_sessions || []).length;
      const teachCount = (d.teachers || []).length;

      const confirmMsg = `ยืนยันการกู้คืนข้อมูลเข้าสู่ระบบ Supabase?\n\n` +
        `พบข้อมูลในไฟล์สำรอง (${file.name}):\n` +
        `• วันที่สำรอง: ${parsed.exported_at ? new Date(parsed.exported_at).toLocaleString('th-TH') : 'ไม่ระบุ'}\n` +
        `• รายชื่อนักเรียน: ${summCount} คน\n` +
        `• ประวัติเช็คชื่อรายวัน: ${dailyCount} รายการ\n` +
        `• รอบเช็คชื่อและภาพถ่าย: ${sessCount} รอบ\n` +
        `• ครูที่ปรึกษา: ${teachCount} คน\n\n` +
        `ระบบจะทำการกู้คืนข้อมูลเข้าสู่ฐานข้อมูล Supabase\nต้องการดำเนินการต่อหรือไม่?`;

      if (!window.confirm(confirmMsg)) {
        if (backupFileInputRef.current) backupFileInputRef.current.value = '';
        setIsRestoringBackup(false);
        return;
      }

      // 1. Restore attendance_summary
      if (d.attendance_summary && d.attendance_summary.length > 0) {
        for (let i = 0; i < d.attendance_summary.length; i += 50) {
          const chunk = d.attendance_summary.slice(i, i + 50);
          await dbAssembly.from('attendance_summary').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 2. Restore daily_attendance
      if (d.daily_attendance && d.daily_attendance.length > 0) {
        for (let i = 0; i < d.daily_attendance.length; i += 50) {
          const chunk = d.daily_attendance.slice(i, i + 50);
          await dbAssembly.from('daily_attendance').upsert(chunk, { onConflict: 'check_date,student_id,academic_year,semester' });
        }
      }

      // 3. Restore attendance_checkin_sessions (clean schema)
      if (d.attendance_checkin_sessions && d.attendance_checkin_sessions.length > 0) {
        const cleanSessions = d.attendance_checkin_sessions.map(s => ({
          check_date: s.check_date,
          teacher_name: s.teacher_name,
          department: s.department,
          class_level: s.class_level,
          total_students: s.total_students,
          present_count: s.present_count,
          absent_count: s.absent_count,
          leave_count: s.leave_count,
          evidence_photo_url: s.evidence_photo_url,
          academic_year: s.academic_year,
          semester: s.semester,
          notes: s.notes || (s.activity_type ? JSON.stringify({ activity_type: s.activity_type }) : null)
        }));
        for (let i = 0; i < cleanSessions.length; i += 50) {
          const chunk = cleanSessions.slice(i, i + 50);
          await dbAssembly.from('attendance_checkin_sessions').upsert(chunk, { onConflict: 'check_date,department,class_level,academic_year,semester' });
        }
      }

      // 4. Restore teachers
      if (d.teachers && d.teachers.length > 0) {
        for (let i = 0; i < d.teachers.length; i += 50) {
          const chunk = d.teachers.slice(i, i + 50);
          await dbAssembly.from('teachers').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 5. Restore system_settings
      if (d.system_settings && d.system_settings.length > 0) {
        for (let i = 0; i < d.system_settings.length; i += 50) {
          const chunk = d.system_settings.slice(i, i + 50);
          await dbAssembly.from('system_settings').upsert(chunk, { onConflict: 'key' });
        }
      }

      alert('🎉 กู้คืนข้อมูลทั้งหมดเข้าสู่ระบบ Supabase เรียบร้อยแล้ว!');
      if (reloadData) reloadData();
      if (fetchStorageStats) fetchStorageStats();
    } catch (err) {
      console.error('Restore error:', err);
      alert('เกิดข้อผิดพลาดในการกู้คืนข้อมูล: ' + (err.message || err));
    } finally {
      setIsRestoringBackup(false);
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
    }
  };

  // Teachers State & Compliance Tracking
  const [teachers, setTeachers] = useState(teachersList || []);
  const [teacherSubTab, setTeacherSubTab] = useState('stats'); // 'stats' | 'manage'
  const [teacherStatsFilter, setTeacherStatsFilter] = useState('all'); // 'all' | 'pending' | 'checked' | 'low'
  const [teacherStatsSearch, setTeacherStatsSearch] = useState('');
  const [isCopiedTeacherList, setIsCopiedTeacherList] = useState(false);
  const [viewingEvidencePhoto, setViewingEvidencePhoto] = useState(null);

  useEffect(() => {
    setTeachers(teachersList || []);
  }, [teachersList]);

  const teacherStatsTodayStr = formatLocalDate(new Date());
  const teacherStatsElapsedDays = (calendarStats?.elapsedDays && calendarStats.elapsedDays > 0)
    ? calendarStats.elapsedDays 
    : (baseTotalDays || 1);

  const teacherStatsList = useMemo(() => {
    return (teachers || []).map(t => {
      const tSessions = (sessions || []).filter(s => {
        const isName = normalizeTeacherName(s.teacher_name) === normalizeTeacherName(t.name);
        if (!isName) return false;
        const sLvl = String(s.class_level || '').replace(/\s+/g, '');
        const tLvl = String(t.class_level || '').replace(/\s+/g, '');
        const sDept = String(s.department || '').replace(/\s+/g, '');
        const tDept = String(t.department || '').replace(/\s+/g, '');
        if (sLvl && tLvl && sLvl !== tLvl) return false;
        if (sDept && tDept && !sDept.includes(tDept) && !tDept.includes(sDept)) return false;
        return true;
      });

      const distinctDates = [...new Set(tSessions.map(s => s.check_date))];
      const submittedDays = distinctDates.length;
      const todaySession = tSessions.find(s => s.check_date === teacherStatsTodayStr);
      const isCheckedToday = Boolean(todaySession);
      const todayTime = todaySession?.created_at ? new Date(todaySession.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : null;
      const compliancePct = teacherStatsElapsedDays > 0 ? Math.min(100, Math.round((submittedDays / teacherStatsElapsedDays) * 100)) : 100;

      return {
        ...t,
        submittedDays,
        elapsedDays: teacherStatsElapsedDays,
        compliancePct,
        isCheckedToday,
        todayTime,
        todaySession,
        distinctDates
      };
    });
  }, [teachers, sessions, teacherStatsElapsedDays, teacherStatsTodayStr]);

  const checkedTodayTeachersCount = useMemo(() => teacherStatsList.filter(t => t.isCheckedToday).length, [teacherStatsList]);
  const pendingTodayTeachersCount = useMemo(() => teacherStatsList.length - checkedTodayTeachersCount, [teacherStatsList, checkedTodayTeachersCount]);
  const lowComplianceTeachersCount = useMemo(() => teacherStatsList.filter(t => t.compliancePct < 80).length, [teacherStatsList]);

  const filteredTeacherStats = useMemo(() => {
    return teacherStatsList.filter(t => {
      if (teacherStatsFilter === 'pending' && t.isCheckedToday) return false;
      if (teacherStatsFilter === 'checked' && !t.isCheckedToday) return false;
      if (teacherStatsFilter === 'low' && t.compliancePct >= 80) return false;
      if (teacherStatsSearch.trim()) {
        const q = teacherStatsSearch.toLowerCase().replace(/\s+/g, '');
        const matchName = String(t.name || '').toLowerCase().replace(/\s+/g, '').includes(q);
        const matchDept = String(t.department || '').toLowerCase().replace(/\s+/g, '').includes(q);
        const matchLvl = String(t.class_level || '').toLowerCase().replace(/\s+/g, '').includes(q);
        return matchName || matchDept || matchLvl;
      }
      return true;
    }).sort((a, b) => {
      if (teacherStatsFilter === 'all') {
        if (a.isCheckedToday !== b.isCheckedToday) return a.isCheckedToday ? 1 : -1;
      }
      return a.compliancePct - b.compliancePct;
    });
  }, [teacherStatsList, teacherStatsFilter, teacherStatsSearch]);

  const handleCopyPendingTeachers = () => {
    const pendingList = teacherStatsList.filter(t => !t.isCheckedToday);
    const dateFormatted = formatThaiDateFull(teacherStatsTodayStr);
    let text = `📢 แจ้งเตือนครูที่ปรึกษาที่ยังไม่ได้ส่งยอดเข้าแถว\n` +
      `วิทยาลัยการอาชีพด่านซ้าย\n` +
      `🗓️ ประจำ${dateFormatted}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `ค้างส่งทั้งหมด ${pendingList.length} ห้องเรียน:\n`;
    if (pendingList.length === 0) {
      text += `🎉 วันนี้คุณครูทุกท่านส่งยอดเข้าแถวครบ 100% แล้วครับ\n`;
    } else {
      pendingList.forEach((t, idx) => {
        text += `${idx + 1}. ${t.name} (${t.class_level} ${formatDeptDisplay(t.department)})\n`;
      });
    }
    text += `━━━━━━━━━━━━━━━━━━\n` +
      `รบกวนคุณครูที่ปรึกษาเข้าสู่ระบบเพื่อเช็คชื่อและแนบภาพถ่ายด้วยครับ`;
    safeCopyToClipboard(text).then(() => {
      setIsCopiedTeacherList(true);
      setTimeout(() => setIsCopiedTeacherList(false), 3500);
    }).catch(() => {
      alert(text);
    });
  };

  // Available Departments synced dynamically with masterStudents, existing teachers, and standard list
  const availableDepartments = useMemo(() => {
    const s = new Set();
    // 1. Existing students in masterStudents
    (masterStudents || []).forEach(st => {
      const d = (st.dept || st.department || '').trim();
      if (d) s.add(normalizeDepartmentName(d));
    });
    // 2. Existing teachers
    (teachers || []).forEach(t => {
      const d = (t.department || '').trim();
      if (d) s.add(normalizeDepartmentName(d));
    });
    // 3. Known standard departments
    CANONICAL_DEPTS.forEach(d => {
      if (d) s.add(normalizeDepartmentName(d));
    });
    return Array.from(s).filter(d => d && d !== 'ทั่วไป').sort((a, b) => a.localeCompare(b, 'th'));
  }, [masterStudents, teachers]);

  const [isCustomTeacherDept, setIsCustomTeacherDept] = useState(false);
  const [isCustomStudentDept, setIsCustomStudentDept] = useState(false);

  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherDept, setNewTeacherDept] = useState('ช่างยนต์');
  const [newTeacherLevel, setNewTeacherLevel] = useState('ปวช.1');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherPin, setNewTeacherPin] = useState('');
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Initialize newTeacherDept from availableDepartments
  useEffect(() => {
    if (availableDepartments.length > 0 && !isCustomTeacherDept && (!newTeacherDept || !availableDepartments.includes(newTeacherDept))) {
      setNewTeacherDept(availableDepartments[0]);
    }
  }, [availableDepartments]);

  // Student Management State
  const [studentSubTab, setStudentSubTab] = useState('list'); // 'list', 'form', 'excel'
  const [termStudentsList, setTermStudentsList] = useState([]);
  const [loadingTermStudents, setLoadingTermStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [studentLevelFilter, setStudentLevelFilter] = useState('ALL');
  const [studentDeptFilter, setStudentDeptFilter] = useState('ALL');
  const [adminStudentPage, setAdminStudentPage] = useState(1);
  const adminStudentPageSize = 35;

  useEffect(() => {
    const t = setTimeout(() => setStudentSearch(studentSearchInput), 200);
    return () => clearTimeout(t);
  }, [studentSearchInput]);

  useEffect(() => {
    setAdminStudentPage(1);
  }, [studentSearch, studentLevelFilter, studentDeptFilter, adminSem, adminYear]);

  // Add / Edit Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentPhoto, setNewStudentPhoto] = useState('');
  const [newStudentDept, setNewStudentDept] = useState('ช่างยนต์');
  const [newStudentLevel, setNewStudentLevel] = useState('ปวช.1');
  const [newStudentTeacher, setNewStudentTeacher] = useState('');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [savingStudent, setSavingStudent] = useState(false);

  // Helper to extract student code safely from studentCodesMap
  const getStudentCode = useCallback((st) => {
    if (!st) return '';
    const safeCodes = (studentCodesMap && typeof studentCodesMap === 'object') ? studentCodesMap : {};
    const id = String(st.id || st.student_id || st.real_id || '');
    if (id && safeCodes[id]) return String(safeCodes[id]);
    const name = String(st.student_name || st.name || '').trim();
    if (name && safeCodes[name]) return String(safeCodes[name]);
    const cleanName = name.replace(/\s+/g, ' ');
    if (cleanName && safeCodes[cleanName]) return String(safeCodes[cleanName]);
    const tightName = name.replace(/\s+/g, '');
    if (tightName) {
      const found = Object.entries(safeCodes).find(([k]) => k.replace(/\s+/g, '') === tightName);
      if (found && found[1]) return String(found[1]);
    }
    return '';
  }, [studentCodesMap]);

  // Dynamic department counts and filter options for student roster (Real data only, NO presets with 0 students)
  const termDepartmentCounts = useMemo(() => {
    const counts = {};
    (termStudentsList || []).forEach(s => {
      const rawDept = s.department || s.dept || '';
      const cleanDept = normalizeDepartmentName(rawDept);
      if (cleanDept && cleanDept !== 'ทั่วไป') {
        counts[cleanDept] = (counts[cleanDept] || 0) + 1;
      }
    });
    return counts;
  }, [termStudentsList]);

  const departmentFilterOptions = useMemo(() => {
    // Only real departments that have actual students in this term (counts > 0)
    // No presets with (0), no dummy entries
    return Object.keys(termDepartmentCounts).sort((a, b) => a.localeCompare(b, 'th'));
  }, [termDepartmentCounts]);

  // Initialize newStudentDept from availableDepartments
  useEffect(() => {
    if (availableDepartments.length > 0 && !isCustomStudentDept && (!newStudentDept || !availableDepartments.includes(newStudentDept))) {
      setNewStudentDept(availableDepartments[0]);
    }
  }, [availableDepartments]);

  // กรองเฉพาะประวัติการเช็คชื่อจริง (ตัดแถวการตั้งค่าระบบ __SYSTEM_SETTINGS__ ออก)
  const realCheckinSessions = useMemo(() => {
    return (sessions || []).filter(s => s.department !== '__SYSTEM_SETTINGS__' && !String(s.department || '').startsWith('__'));
  }, [sessions]);

  // Excel Import State
  const [excelFile, setExcelFile] = useState(null);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [detectedLevel, setDetectedLevel] = useState('ปวช.1');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState('');
  const [excelStep, setExcelStep] = useState('upload'); // 'upload' | 'preview'
  const [overrideLevel, setOverrideLevel] = useState('');   // '' = use per-row detected
  const [overrideDept, setOverrideDept] = useState('');     // '' = use per-row detected
  const [editableStudents, setEditableStudents] = useState([]); // preview rows editable

  // Student Promotion State
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteSummary, setPromoteSummary] = useState(null);

  // Fetch students for current active term (merging Term 1 inherited if in Term 2)
  const fetchTermStudents = async () => {
    setLoadingTermStudents(true);
    try {
      const { data: currentTermData, error } = await dbAssembly
        .from('attendance_summary')
        .select('*')
        .match({ academic_year: adminYear, semester: adminSem });
      
      let combined = currentTermData || [];
      if (String(adminSem) === '2') {
        const { data: term1Data } = await dbAssembly
          .from('attendance_summary')
          .select('*')
          .match({ academic_year: adminYear, semester: '1' });
        
        const existingNames = new Set(combined.map(s => (s.student_name || '').trim()));
        (term1Data || []).forEach(s => {
          const name = (s.student_name || '').trim();
          if (name && !existingNames.has(name)) {
            combined.push({
              ...s,
              id: 'inherited_' + s.id,
              real_id: s.id,
              semester: '2',
              academic_year: adminYear,
              present_days: 0,
              total_days: 0,
              percent: 0,
              _inherited: true
            });
          }
        });
      }
      setTermStudentsList(combined);
    } catch (e) {
      console.warn('Fetch term students error:', e);
    } finally {
      setLoadingTermStudents(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'students') {
      fetchTermStudents();
    }
  }, [adminTab, adminYear, adminSem]);

  const filteredTermStudents = useMemo(() => {
    return termStudentsList.filter(s => {
      if (studentLevelFilter !== 'ALL' && s.pure_level !== studentLevelFilter) return false;
      if (studentDeptFilter !== 'ALL' && normalizeDepartmentName(s.department || s.dept || '') !== studentDeptFilter) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.trim().toLowerCase();
        const matchName = (s.student_name || '').toLowerCase().includes(q);
        const matchDept = (s.department || '').toLowerCase().includes(q) || normalizeDepartmentName(s.department || '').toLowerCase().includes(q);
        const sCode = getStudentCode(s);
        const matchCode = sCode.toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchCode) return false;
      }
      return true;
    });
  }, [termStudentsList, studentLevelFilter, studentDeptFilter, studentSearch, getStudentCode]);

  const adminTotalStudentPages = Math.max(1, Math.ceil(filteredTermStudents.length / adminStudentPageSize));
  const paginatedTermStudents = useMemo(() => {
    const start = (adminStudentPage - 1) * adminStudentPageSize;
    return filteredTermStudents.slice(start, start + adminStudentPageSize);
  }, [filteredTermStudents, adminStudentPage]);

  // Save Student (Add / Edit)
  const handleSaveStudent = async () => {
    if (!newStudentName.trim()) return alert('กรุณากรอกชื่อ-นามสกุลนักเรียน');
    const cleanDept = normalizeDepartmentName(newStudentDept);
    if (!cleanDept || cleanDept === 'ทั่วไป') return alert('กรุณาระบุหรือเลือกแผนกวิชา');
    setSavingStudent(true);
    try {
      let savedStudent = null;
      if (editingStudentId) {
        const isInherited = String(editingStudentId).startsWith('inherited_');
        if (isInherited) {
          const { data: insData, error } = await dbAssembly.from('attendance_summary').insert([{
            student_name: newStudentName.trim(),
            pure_level: newStudentLevel,
            department: cleanDept,
            teacher_email: newStudentTeacher.trim() || '-',
            present_days: 0,
            total_days: 0,
            percent: newStudentLevel === 'สำเร็จการศึกษา' ? 100 : 0,
            academic_year: adminYear,
            semester: adminSem
          }]).select();
          if (error) throw error;
          savedStudent = insData?.[0] || { id: editingStudentId, student_name: newStudentName.trim() };
        } else {
          const { data: updData, error } = await dbAssembly.from('attendance_summary').update({
            student_name: newStudentName.trim(),
            pure_level: newStudentLevel,
            department: cleanDept,
            teacher_email: newStudentTeacher.trim() || '-',
            academic_year: adminYear,
            semester: adminSem
          }).eq('id', editingStudentId).select();
          if (error) throw error;
          savedStudent = updData?.[0] || { id: editingStudentId, student_name: newStudentName.trim() };
        }
        if (onSaveStudentPhoto && newStudentPhoto !== undefined) {
          await onSaveStudentPhoto({ id: savedStudent.id, name: newStudentName.trim(), student_name: newStudentName.trim() }, newStudentPhoto);
        }
        if (onSaveStudentCode) {
          await onSaveStudentCode({
            id: savedStudent.id,
            real_id: savedStudent.id,
            name: newStudentName.trim(),
            student_name: newStudentName.trim()
          }, newStudentCode.trim());
        }
        alert('บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว');
      } else {
        const { data: insData, error } = await dbAssembly.from('attendance_summary').insert([{
          student_name: newStudentName.trim(),
          pure_level: newStudentLevel,
          department: cleanDept,
          teacher_email: newStudentTeacher.trim() || '-',
          present_days: 0,
          total_days: 0,
          percent: newStudentLevel === 'สำเร็จการศึกษา' ? 100 : 0,
          academic_year: adminYear,
          semester: adminSem
        }]).select();
        if (error) throw error;
        savedStudent = insData?.[0] || { student_name: newStudentName.trim() };
        if (newStudentPhoto && onSaveStudentPhoto) {
          await onSaveStudentPhoto({ id: savedStudent?.id, name: newStudentName.trim(), student_name: newStudentName.trim() }, newStudentPhoto);
        }
        if (onSaveStudentCode) {
          await onSaveStudentCode({
            id: savedStudent?.id,
            real_id: savedStudent?.id,
            name: newStudentName.trim(),
            student_name: newStudentName.trim()
          }, newStudentCode.trim());
        }
        alert(`เพิ่มข้อมูลนักเรียน "${newStudentName.trim()}" (${newStudentLevel}) เรียบร้อยแล้ว`);
      }
      setNewStudentName('');
      setNewStudentCode('');
      setNewStudentPhoto('');
      setNewStudentTeacher('');
      setIsCustomStudentDept(false);
      setEditingStudentId(null);
      setStudentSubTab('list');
      await fetchTermStudents();
      if (onUpdateStudents) onUpdateStudents();
    } catch (e) {
      alert('บันทึกล้มเหลว: ' + e.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleEditStudentClick = (student) => {
    setEditingStudentId(student.id);
    setNewStudentName(student.student_name || '');
    setNewStudentCode(getStudentCode(student));
    const cleanD = normalizeDepartmentName(student.department || '');
    setNewStudentDept(cleanD || 'ช่างยนต์');
    setIsCustomStudentDept(Boolean(cleanD && !availableDepartments.includes(cleanD)));
    setNewStudentLevel(student.pure_level || 'ปวช.1');
    setNewStudentTeacher(student.teacher_email || '');
    const existingPhoto = studentPhotosMap[student.id] || studentPhotosMap[student.student_name] || student.photoUrl || '';
    setNewStudentPhoto(existingPhoto);
    setStudentSubTab('form');
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentCode('');
    setNewStudentPhoto('');
    setNewStudentTeacher('');
    setNewStudentLevel('ปวช.1');
    setStudentSubTab('list');
  };

  const handleDeleteStudent = async (student) => {
    if (!confirm(`ต้องการลบรายชื่อ "${student.student_name}" ออกจากภาคเรียนที่ ${adminSem}/${adminYear} หรือไม่?`)) return;
    try {
      if (String(student.id).startsWith('inherited_')) {
        alert('นักเรียนคนนี้เป็นข้อมูลสืบทอดมาจากเทอม 1 หากต้องการนำออกจากระบบ กรุณาสลับไปลบที่เทอม 1 หรือแก้ไขระดับชั้นเป็นสำเร็จการศึกษา');
        return;
      }
      const { error } = await dbAssembly.from('attendance_summary').delete().eq('id', student.id);
      if (error) throw error;
      alert(`ลบรายชื่อ "${student.student_name}" เรียบร้อยแล้ว`);
      await fetchTermStudents();
      if (onUpdateStudents) onUpdateStudents();
    } catch (e) {
      alert('ลบล้มเหลว: ' + e.message);
    }
  };

  // ส่งออกรายชื่อนักเรียนเป็นไฟล์ Excel (.xlsx)
  const handleExportStudentsExcel = () => {
    const listToExport = filteredTermStudents.length > 0 ? filteredTermStudents : termStudentsList;
    if (!listToExport || listToExport.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนสำหรับส่งออก');
      return;
    }
    try {
      const XLSX = window.XLSX;
      if (!XLSX) {
        alert('ไม่พบไลบรารี XLSX กรุณารีเฟรชหน้าเว็บ');
        return;
      }
      const wb = XLSX.utils.book_new();
      const exportRows = listToExport.map((s, idx) => {
        const pct = Number(s.percent) || 0;
        const statLabel = s.pure_level === 'สำเร็จการศึกษา'
          ? 'สำเร็จการศึกษา'
          : pct >= 80
          ? 'ผ่านเกณฑ์'
          : 'เสี่ยงตก (ต่ำกว่า 80%)';
        return {
          'ลำดับ': idx + 1,
          'รหัสประจำตัว': getStudentCode(s) || s.student_id || s.id || '-',
          'ชื่อ - นามสกุล': s.student_name || s.name || '-',
          'ระดับชั้น': s.pure_level || s.level || '-',
          'แผนกวิชา': formatDeptDisplay(s.department || s.dept || '-'),
          'เข้าแถว (วัน)': s.present_days || s.present || 0,
          'วันเรียนทั้งหมด': s.total_days || s.total || 0,
          'ร้อยละ (%)': `${pct}%`,
          'ผลการประเมิน': statLabel,
          'ครูที่ปรึกษา': s.teacher_email || s.teacher || '-',
          'ภาคเรียน': adminSem,
          'ปีการศึกษา': adminYear
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 26 },
        { wch: 12 },
        { wch: 24 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 20 },
        { wch: 22 },
        { wch: 10 },
        { wch: 12 }
      ];
      const sheetName = `นักเรียน_${adminSem}-${adminYear}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      const fileName = `รายชื่อนักเรียน_วกด่านซ้าย_เทอม_${adminSem}_${adminYear}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch(err) {
      console.error('Export Excel error:', err);
      alert('เกิดข้อผิดพลาดในการส่งออก Excel: ' + err.message);
    }
  };

  // Student Promotion for New Academic Year
  const handlePromoteStudents = async () => {
    const confirmText = 
      `ยืนยันการเลื่อนระดับชั้นปีนักศึกษาทั้งหมด?\n\n` +
      `ระบบจะทำการเลื่อนระดับชั้นดังนี้:\n` +
      `• ปวช.1 -> ปวช.2\n` +
      `• ปวช.2 -> ปวช.3\n` +
      `• ปวช.3 -> สำเร็จการศึกษา\n` +
      `• ปวส.1 -> ปวส.2\n` +
      `• ปวส.2 -> สำเร็จการศึกษา\n\n` +
      `ระบบจะบันทึกข้อมูลเข้าสู่ปีการศึกษา ${adminYear} (ภาคเรียนที่ ${adminSem})\n` +
      `เมื่อเสร็จสิ้นแล้ว แอดมินสามารถนำเข้าเฉพาะนักศึกษาใหม่ ปวช.1 และ ปวส.1 ได้ทันที\n\n` +
      `คุณต้องการดำเนินการต่อใช่หรือไม่?`;

    if (!window.confirm(confirmText)) return;

    setIsPromoting(true);
    setPromoteSummary(null);
    try {
      const { data: allStudents, error: fetchErr } = await dbAssembly
        .from('attendance_summary')
        .select('*');
      if (fetchErr) throw fetchErr;

      if (!allStudents || allStudents.length === 0) {
        alert('ยังไม่พบรายชื่อนักเรียนในระบบ');
        setIsPromoting(false);
        return;
      }

      const studentMap = {};
      allStudents.forEach(s => {
        const name = (s.student_name || '').trim();
        if (name && !studentMap[name]) {
          studentMap[name] = s;
        }
      });
      const uniqueStudents = Object.values(studentMap);

      let c1to2 = 0;
      let c2to3 = 0;
      let c3grad = 0;
      let s1to2 = 0;
      let s2grad = 0;
      let otherCount = 0;

      const promoted = [];
      uniqueStudents.forEach(s => {
        let nextLevel = s.pure_level;
        if (s.pure_level === 'ปวช.1') {
          nextLevel = 'ปวช.2';
          c1to2++;
        } else if (s.pure_level === 'ปวช.2') {
          nextLevel = 'ปวช.3';
          c2to3++;
        } else if (s.pure_level === 'ปวช.3') {
          nextLevel = 'สำเร็จการศึกษา';
          c3grad++;
        } else if (s.pure_level === 'ปวส.1') {
          nextLevel = 'ปวส.2';
          s1to2++;
        } else if (s.pure_level === 'ปวส.2') {
          nextLevel = 'สำเร็จการศึกษา';
          s2grad++;
        } else {
          otherCount++;
        }

        promoted.push({
          student_name: s.student_name,
          pure_level: nextLevel,
          department: s.department,
          teacher_email: s.teacher_email || '-',
          present_days: 0,
          total_days: 0,
          percent: nextLevel === 'สำเร็จการศึกษา' ? 100 : 0,
          academic_year: adminYear,
          semester: adminSem
        });
      });

      for (let i = 0; i < promoted.length; i += 50) {
        const chunk = promoted.slice(i, i + 50);
        const { error: insErr } = await dbAssembly.from('attendance_summary').insert(chunk);
        if (insErr) throw insErr;
      }

      const summaryData = {
        total: promoted.length,
        c1to2,
        c2to3,
        c3grad,
        s1to2,
        s2grad,
        otherCount,
        year: adminYear,
        semester: adminSem
      };
      setPromoteSummary(summaryData);

      alert(`เลื่อนระดับชั้นปีนักศึกษาสำเร็จ รวมทั้งสิ้น ${promoted.length} คน!\n\n` +
        `• ปวช.1 -> ปวช.2: ${c1to2} คน\n` +
        `• ปวช.2 -> ปวช.3: ${c2to3} คน\n` +
        `• ปวช.3 -> สำเร็จการศึกษา: ${c3grad} คน\n` +
        `• ปวส.1 -> ปวส.2: ${s1to2} คน\n` +
        `• ปวส.2 -> สำเร็จการศึกษา: ${s2grad} คน\n\n` +
        `ขณะนี้ห้อง ปวช.1 และ ปวส.1 พร้อมรับนักศึกษาใหม่แล้ว`
      );
      await fetchTermStudents();
      if (onUpdateStudents) onUpdateStudents();
    } catch (err) {
      alert('การเลื่อนระดับชั้นปีล้มเหลว: ' + err.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleSaveTerm = async () => {
    setSavingTerm(true);
    try {
      const token = sessionStorage.getItem('admin_session_token') || '';
      const termKey = `${adminYear}_${adminSem}`;
      const updatedSchedules = {
        ...(termSchedules || {}),
        [termKey]: {
          startDate: adminStartDate,
          endDate: adminEndDate || '',
          useFixedDays: !adminEnableCalendar,
          fixedDays: Number(adminFixedDays) || 65
        }
      };

      const finalBaseDays = !adminEnableCalendar ? (Number(adminFixedDays) || 65) : (adminLiveStats.totalTermDays || days || 96);

      const records = [
        { key: 'current_academic_year', value: adminYear },
        { key: 'current_semester', value: adminSem },
        { key: 'enable_calendar_mode', value: adminEnableCalendar ? 'true' : 'false' },
        { key: 'term_start_date', value: adminStartDate },
        { key: 'term_end_date', value: adminEndDate || '' },
        { key: 'base_total_days', value: String(finalBaseDays) },
        { key: 'term_schedules_map', value: JSON.stringify(updatedSchedules) }
      ];
      const { data, error } = await dbAssembly.rpc('admin_save_system_settings_batch_secure', {
        p_settings: records,
        p_auth_token_or_pin: token
      });
      if (error || (data && !data.success)) throw new Error(error?.message || data?.error || 'บันทึกล้มเหลว');
      if (onSaveCalendarEnabled) onSaveCalendarEnabled(adminEnableCalendar);
      if (onUpdateTermSchedules) onUpdateTermSchedules(updatedSchedules);
      if (onSaveCalendarSettings) onSaveCalendarSettings({ termStartDate: adminStartDate, termEndDate: adminEndDate });
      if (onSaveAcademicTerm) onSaveAcademicTerm(adminYear, adminSem);
      alert(`สลับและบันทึกภาคเรียนที่ ${adminSem}/${adminYear} เรียบร้อยแล้ว\n${!adminEnableCalendar ? `(โหมดไม่ใช้ปฏิทิน: กำหนดเกณฑ์วันรวม ${finalBaseDays} วัน · ผ่าน 80% = ${Math.ceil(finalBaseDays * 0.8)} วัน)` : '(เปิดใช้งานโหมดปฏิทินวันเปิด-ปิดเทอม)'}`);
    } catch (e) {
      alert('ล้มเหลว: ' + e.message);
    } finally {
      setSavingTerm(false);
    }
  };

  const handleSaveDays = async () => {
    if (!days || days <= 0) return alert('ระบุจำนวนวันให้ถูกต้อง');
    setSavingDays(true);
    try {
      const token = sessionStorage.getItem('admin_session_token') || '';
      const { data, error } = await dbAssembly.rpc('admin_save_system_setting_secure', {
        p_key: 'base_total_days',
        p_value: String(days),
        p_auth_token_or_pin: token
      });
      if (error || (data && !data.success)) throw new Error(error?.message || data?.error || 'บันทึกล้มเหลว');
      alert(`บันทึกเกณฑ์วันรวม ${days} วัน เรียบร้อยแล้ว`);
      onSaveDays(days);
    } catch (e) {
      alert('ล้มเหลว: ' + e.message);
    } finally {
      setSavingDays(false);
    }
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      await dbAssembly.from('system_rules').delete().gt('id', 0);
      const { error } = await dbAssembly.from('system_rules').insert(ruleList);
      if (error) throw error;
      alert('บันทึกเกณฑ์เงื่อนไขเรียบร้อยแล้ว');
      onSaveRules(ruleList);
    } catch (e) {
      alert('ล้มเหลว: ' + e.message);
    } finally {
      setSavingRules(false);
    }
  };

  // Add Teacher
  const handleAddTeacher = async () => {
    if (!newTeacherName.trim()) return alert('กรุณากรอกชื่อ-นามสกุลครู');
    const cleanDept = normalizeDepartmentName(newTeacherDept);
    if (!cleanDept || cleanDept === 'ทั่วไป') return alert('กรุณาระบุหรือเลือกแผนกวิชา');
    setSavingTeacher(true);
    try {
      let pinHash = null;
      const cleanPin = newTeacherPin.trim();
      if (cleanPin) {
        if (!/^\d{6}$/.test(cleanPin)) {
          setSavingTeacher(false);
          return alert('รหัสประจำห้องต้องเป็นตัวเลข 6 หลักเท่านั้น (เช่น 201010)');
        }
        pinHash = await hashPassword(cleanPin);
      } else {
        const defPin = window.getDefaultTeacherPin ? window.getDefaultTeacherPin({ department: cleanDept, class_level: newTeacherLevel }) : '';
        if (defPin) {
          pinHash = await hashPassword(defPin);
        } else {
          setSavingTeacher(false);
          return alert('กรุณาระบุรหัส PIN ประจำห้อง 6 หลักสำหรับครูท่านนี้ (เช่น 201010)');
        }
      }
      const newRec = {
        name: newTeacherName.trim(),
        department: cleanDept,
        class_level: newTeacherLevel,
        phone: newTeacherPhone.trim(),
        pin_hash: pinHash,
        academic_year: adminYear,
        semester: adminSem
      };
      const { data, error } = await dbAssembly.from('teachers').insert([newRec]).select();
      if (error) throw error;
      alert('เพิ่มข้อมูลครูที่ปรึกษาเรียบร้อยแล้ว' + (cleanPin ? ` (รหัสประจำห้อง 6 หลัก: ${cleanPin})` : ''));
      setNewTeacherName('');
      setNewTeacherPhone('');
      setNewTeacherPin('');
      setIsCustomTeacherDept(false);
      if (data && data[0]) setTeachers([...teachers, data[0]]);
      if (onUpdateTeachers) onUpdateTeachers();
    } catch (e) {
      alert('ล้มเหลว: ' + e.message);
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleSetTeacherPin = async (teacherId, teacherName, currentDept, currentLevel) => {
    const inputPin = prompt(`กรุณาระบุรหัสประจำห้อง 6 หลักสำหรับ "${teacherName}"\n(${currentLevel} แผนก${currentDept}):\n\n(ระบุเป็นตัวเลข 6 หลัก เช่น 201010, 301050 หรือรหัสที่ต้องการ สามารถใช้รหัสซ้ำกันได้)`);
    if (inputPin === null) return;
    const cleanPin = inputPin.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      alert('กรุณากรอกเป็นตัวเลข 6 หลักเท่านั้น (เช่น 201010)');
      return;
    }
    try {
      const newHash = await hashPassword(cleanPin);

      // Sync PIN to all rooms managed by the same teacher
      const currentClean = normalizeTeacherName(teacherName);
      let siblingIds = [teacherId];
      try {
        const { data: allTeachers } = await dbAssembly.from('teachers').select('id, name');
        if (allTeachers && allTeachers.length > 0) {
          siblingIds = allTeachers.filter(t => normalizeTeacherName(t.name) === currentClean).map(t => t.id);
          if (!siblingIds.includes(teacherId)) siblingIds.push(teacherId);
        }
      } catch (sibErr) {
        console.warn('Sibling IDs fetch fallback:', sibErr);
      }

      const { error } = await dbAssembly.from('teachers').update({ pin_hash: newHash }).in('id', siblingIds);
      if (error) throw error;
      if (siblingIds.length > 1) {
        alert(`บันทึกรหัสประจำห้อง "${cleanPin}" ให้ ${teacherName} ครบทั้ง ${siblingIds.length} ห้องเรียนที่ดูแลเรียบร้อยแล้ว`);
      } else {
        alert(`บันทึกรหัสประจำห้อง "${cleanPin}" ให้ ${teacherName} (${currentLevel} แผนก${currentDept}) เรียบร้อยแล้ว`);
      }
      if (onUpdateTeachers) onUpdateTeachers();
    } catch (e) {
      alert('บันทึกรหัสล้มเหลว: ' + e.message);
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!confirm(`ต้องการลบครู "${teacherName}" ออกจากระบบหรือไม่?`)) return;
    try {
      const { error } = await dbAssembly.from('teachers').delete().eq('id', teacherId);
      if (error) throw error;
      setTeachers(teachers.filter(t => t.id !== teacherId));
      if (onUpdateTeachers) onUpdateTeachers();
    } catch (e) {
      alert('ล้มเหลว: ' + e.message);
    }
  };

  // Handle Excel Upload → parse only, then show preview
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFile(file);
    setImportStatusMsg('');
    setExcelStep('upload');
    setOverrideLevel('');
    setOverrideDept('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // 1. Try to detect class level from filename first (most reliable)
        let lvl = '';
        const filenameLevel = extractClassLevel(file.name);
        if (filenameLevel && filenameLevel !== 'ปวช.1') {
          lvl = filenameLevel; // detected clearly from filename
        }

        let headerRowIdx = -1;
        let colIdIdx = -1;
        let colNameIdx = -1;
        let colDeptIdx = -1;

        // 2. Scan header rows for column positions + fallback level detection
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').trim();
            // Only use cell-based level if not already found from filename
            if (!lvl) {
              const extracted = extractClassLevel(cell);
              if (extracted) lvl = extracted;
            }
            if (/รหัสประจำตัว|รหัสนัก|รหัส/i.test(cell) && colIdIdx === -1) {
              colIdIdx = c;
              headerRowIdx = r;
            }
            if (/ชื่อ\s*(-|–)?\s*สกุล|ชื่อ\s+สกุล|ชื่อนักเรียน|ชื่อ/i.test(cell) && colNameIdx === -1) {
              colNameIdx = c;
              headerRowIdx = r;
            }
            if (/แผนก|สาขา|หน่วย/i.test(cell) && colDeptIdx === -1) {
              colDeptIdx = c;
            }
          }
        }

        if (!lvl) lvl = 'ปวช.1'; // last resort fallback
        if (colIdIdx === -1) colIdIdx = 1;
        if (colNameIdx === -1) colNameIdx = 2;
        if (headerRowIdx === -1) headerRowIdx = 2;

        setDetectedLevel(lvl);

        const list = [];
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const sidRaw = String(row[colIdIdx] || '').trim();
          const nameRaw = String(row[colNameIdx] || '').trim();
          if (!sidRaw && !nameRaw) continue;
          const cleanSid = sidRaw.replace(/\D/g, '');
          if (cleanSid.length < 5 && !nameRaw) continue;

          // Try to get dept from column, then fallback to student ID
          const deptFromCol = colDeptIdx !== -1 ? String(row[colDeptIdx] || '').trim() : '';
          const dept = deptFromCol || getDeptFromStudentId(cleanSid);

          list.push({
            student_id: cleanSid || sidRaw,
            full_name: nameRaw,
            department: dept,
            class_level: lvl
          });
        }

        setParsedStudents(list);
        setEditableStudents(list.map(s => ({ ...s }))); // editable copy
        setExcelStep('preview');
      } catch (err) {
        alert('อ่านไฟล์ล้มเหลว: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Import to attendance_summary via RPC admin_insert_students_bulk (SECURITY DEFINER bypasses RLS)
  const handleExecuteImport = async () => {
    const finalList = editableStudents.length > 0 ? editableStudents : parsedStudents;
    if (finalList.length === 0) return alert('ไม่มีข้อมูลนักเรียนที่จะนำเข้า');
    const token = sessionStorage.getItem('admin_session_token') || '';
    if (!token) return alert('หมดเวลา session กรุณาล็อกอินแอดมินใหม่');
    setIsImporting(true);
    setImportStatusMsg(`กำลังนำเข้า... 0/${finalList.length} คน`);
    try {
      const records = finalList.map(s => ({
        student_name: s.full_name,
        pure_level: overrideLevel || s.class_level,
        department: overrideDept || s.department,
        teacher_email: '-',
        present_days: 0,
        total_days: 0,
        percent: 0,
        academic_year: adminYear,
        semester: adminSem
      }));

      // Send in batches of 100 via RPC (SECURITY DEFINER bypasses RLS)
      let totalInserted = 0;
      const BATCH = 100;
      for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        const { data, error } = await dbAssembly.rpc('admin_insert_students_bulk', {
          p_records: batch,
          p_auth_token_or_pin: token
        });
        if (error) throw error;
        if (data && data.success === false) throw new Error(data.error || 'RPC ปฏิเสธคำขอ');
        totalInserted += (data?.inserted ?? batch.length);
        setImportStatusMsg(`กำลังนำเข้า... ${totalInserted}/${records.length} คน`);
      }

      alert(`นำเข้ารายชื่อนักเรียนจำนวน ${totalInserted} คน สู่ภาคเรียนที่ ${adminSem}/${adminYear} เรียบร้อยแล้ว`);
      setImportStatusMsg(`นำเข้าสำเร็จ ${totalInserted} คน สู่ภาคเรียนที่ ${adminSem}/${adminYear}`);
      setParsedStudents([]);
      setEditableStudents([]);
      setExcelStep('upload');
      setOverrideLevel('');
      setOverrideDept('');
      setExcelFile(null);
      setStudentSubTab('list');
      await fetchTermStudents();
      if (onUpdateStudents) onUpdateStudents();
    } catch (e) {
      alert('นำเข้าล้มเหลว: ' + e.message);
      setImportStatusMsg('');
    } finally {
      setIsImporting(false);
    }
  };

  const tabMeta = {
    term: {
      title: "ปีการศึกษา & ภาคเรียน",
      subtitle: `ภาคเรียนที่ ${adminSem}/${adminYear} • กำหนดวันเปิด-ปิดเทอม หรือโหมดวันรวมคงที่`
    },
    general: {
      title: "เกณฑ์ 80% & วันเข้าแถว",
      subtitle: "กำหนดเกณฑ์ 80%, วันรวม, ปลดล็อกเช็คนอกเวลา และแนวทางแก้กิจกรรม"
    },
    students: {
      title: "จัดการข้อมูลนักเรียน",
      subtitle: "ค้นหา แก้ไข เพิ่มนักเรียนใหม่ และนำเข้าข้อมูลจากไฟล์ Excel"
    },
    teachers: {
      title: "ครูที่ปรึกษา & สถิติการเช็คชื่อ",
      subtitle: "ติดตามการส่งยอดประจำวัน, สถิติความสม่ำเสมอทั้งเทอม และจัดการรหัส PIN ประจำห้อง"
    },
    logs: {
      title: "บันทึกการเช็คชื่อ & ภาพถ่าย",
      subtitle: "ตรวจสอบประวัติการเช็คชื่อแถวย้อนหลังพร้อมรูปถ่าย"
    },
    storage: {
      title: "พื้นที่จัดเก็บ & ล้างข้อมูลเทอม",
      subtitle: "ตรวจสอบสถิติพื้นที่จัดเก็บภาพถ่าย และล้างข้อมูลเทอมเก่าเพื่อคืนพื้นที่"
    },
    line: {
      title: "การแจ้งเตือน LINE Notify",
      subtitle: "ตั้งค่า LINE Token ส่งสรุปผลการเข้าแถวประจำวัน"
    },
    recheck: {
      title: "จัดการกิจกรรมกลางของวิทยาลัย",
      subtitle: "สร้างและกำหนดกิจกรรมกลางสำหรับภาคเรียนนี้ เพื่อให้ครูที่ปรึกษาเช็คชื่อเข้าร่วม"
    }
  };

  return /*#__PURE__*/_jsx("div", {
    className: "fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-2 sm:p-4 md:p-6",
    onClick: onClose,
    children: /*#__PURE__*/_jsxs("div", {
      className: "bg-white border border-slate-200/80 rounded-3xl max-w-5xl w-full h-[92vh] max-h-[860px] flex flex-col sm:flex-row shadow-2xl overflow-hidden",
      onClick: e => e.stopPropagation(),
      children: [
        /* ================= LEFT SIDEBAR (VOCATIONAL MAROON GRADIENT) ================= */
        /*#__PURE__*/_jsxs("aside", {
          className: "sm:w-64 md:w-72 bg-gradient-to-b from-[#3a050b] via-[#590b14] to-[#7a121e] text-rose-100 flex flex-col flex-shrink-0 border-r border-[#690f1b] shadow-xl",
          children: [
            /* Brand Header */
            /*#__PURE__*/_jsxs("div", {
              className: "p-4 sm:p-5 border-b border-rose-900/50 flex items-center justify-between",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [
                    /*#__PURE__*/_jsx("img", {
                      src: "logo.png",
                      alt: "ตราวิทยาลัย",
                      className: "w-10 h-10 object-contain flex-shrink-0 drop-shadow-md"
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      children: [
                        /*#__PURE__*/_jsx("h2", {
                          className: "text-sm sm:text-base font-bold text-white tracking-tight leading-tight",
                          children: "การจัดการระบบ"
                        }),
                        /*#__PURE__*/_jsx("p", {
                          className: "text-[11px] text-rose-200/80 font-medium",
                          children: "วก.ด่านซ้าย • แอดมิน"
                        })
                      ]
                    })
                  ]
                }),
                /* Mobile close button */
                /*#__PURE__*/_jsx("button", {
                  onClick: onClose,
                  className: "sm:hidden w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base cursor-pointer",
                  children: /*#__PURE__*/_jsx(Icon.Close, { className: "w-4 h-4 text-white" })
                })
              ]
            }),

            /* Mobile Horizontal Scrollable Pill Bar (sm:hidden) */
            /*#__PURE__*/_jsxs("div", {
              className: "sm:hidden flex items-center gap-2 p-2.5 bg-[#250409] border-b border-rose-900/70 overflow-x-auto no-scrollbar scroll-smooth",
              style: { WebkitOverflowScrolling: "touch" },
              children: [
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("term"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "term" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3.5 h-3.5" }), "ปีการศึกษา"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("general"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "general" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Gear, { className: "w-3.5 h-3.5" }), "เกณฑ์ 80%"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("students"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "students" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Users, { className: "w-3.5 h-3.5" }), "นักเรียน"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("teachers"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "teachers" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Academic, { className: "w-3.5 h-3.5" }), "จัดการครู"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("teacher_stats"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "teacher_stats" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [
                    /*#__PURE__*/_jsx(Icon.Chart, { className: "w-3.5 h-3.5" }),
                    "สถิติเช็คชื่อครู",
                    /*#__PURE__*/_jsxs("span", {
                      className: "ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono",
                      children: [checkedTodayTeachersCount, "/", teacherStatsList.length]
                    })
                  ]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("logs"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "logs" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Camera, { className: "w-3.5 h-3.5" }), "ภาพถ่าย"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("storage"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "storage" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Shield, { className: "w-3.5 h-3.5" }), "พื้นที่"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("line"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "line" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Message, { className: "w-3.5 h-3.5" }), "แจ้งเตือน LINE"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("recheck"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "recheck" ? "bg-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-300/40" : "bg-white/10 text-rose-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Academic, { className: "w-3.5 h-3.5" }), "กิจกรรมกลาง"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab("clubs"),
                  className: "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 " + (adminTab === "clubs" ? "bg-amber-600 text-white shadow-md shadow-amber-950/60 ring-1 ring-amber-300/40" : "bg-white/10 text-amber-100 hover:bg-white/15"),
                  children: [/*#__PURE__*/_jsx(Icon.Award, { className: "w-3.5 h-3.5" }), "กิจกรรมชมรม"]
                })
              ]
            }),
            /* Mobile Horizontal Scrollable Pill Bar (sm:hidden) */
            /*#__PURE__*/_jsxs("div", {
              className: "sm:hidden flex items-center gap-1.5 p-2 bg-[#2d0408]/80 border-b border-rose-900/60 overflow-x-auto custom-scroll",
              children: [
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('term'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'term' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3.5 h-3.5" }), "ปีการศึกษา"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('general'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'general' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Gear, { className: "w-3.5 h-3.5" }), "เกณฑ์ 80%"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('students'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'students' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Users, { className: "w-3.5 h-3.5" }), "นักเรียน"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('teachers'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'teachers' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Academic, { className: "w-3.5 h-3.5" }), "จัดการครู"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('teacher_stats'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'teacher_stats' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [
                    /*#__PURE__*/_jsx(Icon.Chart, { className: "w-3.5 h-3.5" }),
                    "สถิติเช็คชื่อครู",
                    /*#__PURE__*/_jsxs("span", {
                      className: "ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono",
                      children: [checkedTodayTeachersCount, "/", teacherStatsList.length]
                    })
                  ]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('logs'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'logs' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Camera, { className: "w-3.5 h-3.5" }), "ภาพถ่าย"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('storage'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'storage' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Shield, { className: "w-3.5 h-3.5" }), "พื้นที่"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('line'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'line' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Message, { className: "w-3.5 h-3.5" }), "แจ้งเตือน LINE"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('recheck'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'recheck' ? 'bg-white text-rose-900 shadow-sm' : 'text-rose-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Academic, { className: "w-3.5 h-3.5" }), "จัดการกิจกรรมกลาง"]
                }),
                /*#__PURE__*/_jsxs("button", {
                  onClick: () => setAdminTab('clubs'),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${adminTab === 'clubs' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-200 hover:text-white hover:bg-white/10'}`,
                  children: [/*#__PURE__*/_jsx(Icon.Award, { className: "w-3.5 h-3.5" }), "จัดการกิจกรรมชมรม"]
                })
              ]
            }),

            /* Desktop Sidebar Navigation Menu */
            /*#__PURE__*/_jsxs("nav", {
              className: "hidden sm:flex flex-col flex-1 p-3.5 space-y-4 overflow-y-auto custom-scroll",
              children: [
                /* Group: การตั้งค่าระบบ */
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("div", {
                      className: "px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300/80",
                      children: "⚙️ การตั้งค่าระบบ"
                    }),
                    /* Tab: term */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('term'),
                      className: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'term' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Calendar, { className: `w-4 h-4 ${adminTab === 'term' ? 'text-white' : 'text-rose-300'}` }),
                            /*#__PURE__*/_jsx("span", { children: "ปีการศึกษา & เทอม" })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("span", {
                          className: `text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${adminTab === 'term' ? 'bg-white text-rose-900' : 'bg-black/30 text-rose-200 border border-rose-800/80'}`,
                          children: [adminSem, "/", adminYear]
                        })
                      ]
                    }),
                    /* Tab: general */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('general'),
                      className: `w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'general' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Gear, { className: `w-4 h-4 ${adminTab === 'general' ? 'text-white' : 'text-rose-300'}` }),
                        /*#__PURE__*/_jsx("span", { children: "เกณฑ์ 80% & วันเข้าแถว" })
                      ]
                    }),
                    /* Tab: line */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('line'),
                      className: `w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'line' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Message, { className: `w-4 h-4 ${adminTab === 'line' ? 'text-white' : 'text-rose-300'}` }),
                        /*#__PURE__*/_jsx("span", { children: "การแจ้งเตือน LINE" })
                      ]
                    })
                  ]
                }),

                /* Group: จัดการข้อมูลบุคลากร */
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("div", {
                      className: "px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300/80",
                      children: "👥 ข้อมูลบุคลากร"
                    }),
                    /* Tab: students */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('students'),
                      className: `w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'students' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Users, { className: `w-4 h-4 ${adminTab === 'students' ? 'text-white' : 'text-rose-300'}` }),
                        /*#__PURE__*/_jsx("span", { children: "จัดการข้อมูลนักเรียน" })
                      ]
                    }),
                    /* Tab: teachers */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('teachers'),
                      className: `w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'teachers' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Academic, { className: `w-4 h-4 ${adminTab === 'teachers' ? 'text-white' : 'text-rose-300'}` }),
                        /*#__PURE__*/_jsx("span", { children: "จัดการครูที่ปรึกษา" })
                      ]
                    }),
                    /* Tab: teacher_stats */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('teacher_stats'),
                      className: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'teacher_stats' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Chart, { className: `w-4 h-4 ${adminTab === 'teacher_stats' ? 'text-white' : 'text-rose-300'}` }),
                            /*#__PURE__*/_jsx("span", { children: "สถิติการเช็คชื่อครู" })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("span", {
                          className: `text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${adminTab === 'teacher_stats' ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'}`,
                          children: [checkedTodayTeachersCount, "/", teacherStatsList.length]
                        })
                      ]
                    })
                  ]
                }),

                /* Group: สถิติ & พื้นที่ */
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("div", {
                      className: "px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300/80",
                      children: "📊 สถิติ & หลักฐาน"
                    }),
                    /* Tab: logs */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('logs'),
                      className: `w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'logs' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Camera, { className: `w-4 h-4 ${adminTab === 'logs' ? 'text-white' : 'text-rose-300'}` }),
                        /*#__PURE__*/_jsx("span", { children: "บันทึกเช็คชื่อ & ภาพถ่าย" })
                      ]
                    }),
                    /* Tab: storage */
                    /*#__PURE__*/_jsxs("button", {
                      onClick: () => setAdminTab('storage'),
                      className: `w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'storage' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Shield, { className: `w-4 h-4 ${adminTab === 'storage' ? 'text-white' : 'text-rose-300'}` }),
                        /*#__PURE__*/_jsx("span", { children: "พื้นที่ & ล้างข้อมูลเทอม" })
                      ]
                    })
                  ]
                }),

                /* Group: ลิงก์ระบบอื่น */
                /*#__PURE__*/_jsxs("div", {
                  className: "pt-2 space-y-1",
                  children: [
                    /*#__PURE__*/_jsx("div", {
                      className: "px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300/80",
                      children: "🎪 กิจกรรมกลาง"
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: () => setAdminTab('recheck'),
                      className: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'recheck' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-rose-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Academic, { className: `w-4 h-4 ${adminTab === 'recheck' ? 'text-white' : 'text-rose-300'}` }),
                            /*#__PURE__*/_jsx("span", { children: "จัดการกิจกรรมกลาง" })
                          ]
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: () => setAdminTab('clubs'),
                      className: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${adminTab === 'clubs' ? 'bg-white/20 text-white font-bold border border-white/30 shadow-xs backdrop-blur-xs' : 'text-amber-100/80 hover:text-white hover:bg-white/10'}`,
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Award, { className: `w-4 h-4 ${adminTab === 'clubs' ? 'text-white' : 'text-amber-300'}` }),
                            /*#__PURE__*/_jsx("span", { children: "จัดการกิจกรรมชมรม" })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            }),

            /* Sidebar Footer */
            /*#__PURE__*/_jsxs("div", {
              className: "p-3.5 border-t border-rose-900/50 bg-[#2b0408]/60 flex items-center justify-between gap-2",
              children: [
                /*#__PURE__*/_jsxs("button", {
                  onClick: onLogout,
                  className: "flex items-center gap-1.5 px-3 py-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                  title: "ออกจากระบบแอดมิน",
                  children: [
                    /*#__PURE__*/_jsx(Icon.Lock, { className: "w-3.5 h-3.5 text-rose-300" }),
                    /*#__PURE__*/_jsx("span", { children: "ออกจากระบบ" })
                  ]
                }),
                /*#__PURE__*/_jsx("span", {
                  className: "text-[10px] font-mono text-rose-300/70 hidden sm:inline",
                  children: "Secure RPC"
                })
              ]
            })
          ]
        }),

        /* ================= RIGHT MAIN CONTENT ================= */
        /*#__PURE__*/_jsxs("div", {
          className: "flex-1 flex flex-col min-w-0 bg-slate-50/60 overflow-hidden",
          children: [
            /* Right Top Header */
            /*#__PURE__*/_jsxs("div", {
              className: "px-5 sm:px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between flex-shrink-0 shadow-xs",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-0.5",
                  children: [
                    /*#__PURE__*/_jsx("h3", {
                      className: "text-base sm:text-lg font-bold text-slate-900 tracking-tight",
                      children: tabMeta[adminTab]?.title || "การจัดการระบบ"
                    }),
                    /*#__PURE__*/_jsx("p", {
                      className: "text-xs text-slate-500",
                      children: tabMeta[adminTab]?.subtitle || ""
                    })
                  ]
                }),
                /*#__PURE__*/_jsx("button", {
                  onClick: onClose,
                  className: "w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer",
                  title: "ปิดหน้าต่าง",
                  children: /*#__PURE__*/_jsx(Icon.Close, { className: "w-5 h-5 text-slate-600" })
                })
              ]
            }),

            /* Scrollable Tab Content Container */
            /*#__PURE__*/_jsxs("div", {
              className: "p-4 sm:p-6 md:p-8 overflow-y-auto custom-scroll flex-1 space-y-4",
              children: [
            // TAB 1: Academic Year
            adminTab === 'term' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4 max-w-lg mx-auto py-2",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "p-5 bg-sky-50 rounded-2xl border border-sky-200 space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        /*#__PURE__*/_jsxs("h3", {
                          className: "text-sm font-bold text-sky-900 flex items-center gap-1.5",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Calendar, { className: "w-4 h-4 text-sky-700" }),
                            "กำหนดปีการศึกษาและภาคเรียน"
                          ]
                        }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "ปีการศึกษา & ภาคเรียน",
                          text: "เลือกรอบปีการศึกษาและภาคเรียนที่ต้องการให้ระบบแสดงผล และกำหนดวันเปิด-ปิดภาคเรียนเพื่อคำนวณวันเข้าแถวจริงอัตโนมัติ"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          children: [
                            /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: "ภาคเรียนที่" }),
                            /*#__PURE__*/_jsxs("select", {
                              value: adminSem,
                              onChange: e => handleAdminSemChange(e.target.value),
                              className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer",
                              children: [
                                /*#__PURE__*/_jsx("option", { value: "1", children: "ภาคเรียนที่ 1" }),
                                /*#__PURE__*/_jsx("option", { value: "2", children: "ภาคเรียนที่ 2" })
                              ]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          children: [
                            /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: "ปีการศึกษา (พ.ศ.)" }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex gap-1.5",
                              children: [
                                /*#__PURE__*/_jsx("select", {
                                  value: adminYear,
                                  onChange: e => handleAdminYearChange(e.target.value),
                                  className: "flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer font-mono",
                                  children: availableYears.map(yr => (
                                    /*#__PURE__*/_jsxs("option", { value: yr, children: [yr, yr === '2569' ? " (ปีปัจจุบัน)" : ""] }, yr)
                                  ))
                                }),
                                /*#__PURE__*/_jsxs("button", {
                                  type: "button",
                                  onClick: handleAddNewYearPrompt,
                                  className: "px-2.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1",
                                  title: "เพิ่มปีการศึกษาใหม่",
                                  children: [/*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }), " เพิ่มปี"]
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    }),

                    // MASTER TOGGLE: Calendar vs Fixed Days Mode
                    /*#__PURE__*/_jsxs("div", {
                      className: "pt-2.5 border-t border-sky-200/80 space-y-3",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            /*#__PURE__*/_jsxs("span", {
                              className: "text-xs font-bold text-slate-800 flex items-center gap-1.5",
                              children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3.5 h-3.5 text-sky-700" }), "ระบบปฏิทิน & วันเปิด-ปิดภาคเรียน"]
                            }),
                            /*#__PURE__*/_jsx("span", {
                              className: `text-[10px] font-bold px-2 py-0.5 rounded-full border ${adminEnableCalendar ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`,
                              children: adminEnableCalendar ? 'เปิดใช้ปฏิทิน' : 'ไม่ใช้ปฏิทิน (กำหนดวันคงที่)'
                            })
                          ]
                        }),

                        /*#__PURE__*/_jsxs("div", {
                          className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
                          children: [
                            /*#__PURE__*/_jsxs("button", {
                              type: "button",
                              onClick: () => setAdminEnableCalendar(false),
                              className: `p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${!adminEnableCalendar ? 'border-sky-600 bg-sky-100/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`,
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  className: "flex items-center gap-2 mb-1",
                                  children: [
                                    /*#__PURE__*/_jsx("input", {
                                      type: "radio",
                                      name: "calModeRadio",
                                      checked: !adminEnableCalendar,
                                      onChange: () => setAdminEnableCalendar(false),
                                      className: "text-sky-600 cursor-pointer"
                                    }),
                                    /*#__PURE__*/_jsx("span", { className: "text-xs font-bold text-slate-900", children: "ไม่ใช้ระบบปฏิทิน (แนะนำ)" })
                                  ]
                                }),
                                /*#__PURE__*/_jsx("p", {
                                  className: "text-[11px] text-slate-500 leading-relaxed pl-5",
                                  children: "ตัดปัญหาเรื่องวันหยุดที่ไม่ได้บันทึก กำหนดเกณฑ์วันรวมตรงๆ เริ่มต้นเทอมใหม่ได้ทันที"
                                })
                              ]
                            }),

                            /*#__PURE__*/_jsxs("button", {
                              type: "button",
                              onClick: () => setAdminEnableCalendar(true),
                              className: `p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${adminEnableCalendar ? 'border-amber-500 bg-amber-50 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`,
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  className: "flex items-center gap-2 mb-1",
                                  children: [
                                    /*#__PURE__*/_jsx("input", {
                                      type: "radio",
                                      name: "calModeRadio",
                                      checked: adminEnableCalendar,
                                      onChange: () => setAdminEnableCalendar(true),
                                      className: "text-amber-600 cursor-pointer"
                                    }),
                                    /*#__PURE__*/_jsx("span", { className: "text-xs font-bold text-slate-900", children: "ใช้ระบบปฏิทินวันเปิด-ปิด" })
                                  ]
                                }),
                                /*#__PURE__*/_jsx("p", {
                                  className: "text-[11px] text-slate-500 leading-relaxed pl-5",
                                  children: "ระบุวันเปิด-ปิดเทอมและบันทึกวันหยุดพิเศษในปฏิทินเพื่อนับวันเรียนตามช่วงวัน"
                                })
                              ]
                            })
                          ]
                        }),

                        // CASE 1: ไม่ใช้ระบบปฏิทิน (กำหนดวันคงที่ - ตัดปัญหาวันหยุด)
                        !adminEnableCalendar ? /*#__PURE__*/_jsxs("div", {
                          className: "p-3.5 bg-white border border-sky-200 rounded-xl space-y-2.5 mt-2",
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                /*#__PURE__*/_jsxs("label", {
                                  className: "text-xs font-bold text-slate-800",
                                  children: ["เกณฑ์จำนวนวันเข้าแถวรวม (เทอม ", adminSem, "/", adminYear, "):"]
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  className: "flex items-center gap-1.5",
                                  children: [
                                    /*#__PURE__*/_jsx("input", {
                                      type: "number",
                                      min: "1",
                                      max: "200",
                                      value: adminFixedDays,
                                      onChange: e => setAdminFixedDays(parseInt(e.target.value, 10) || ''),
                                      className: "w-20 bg-sky-50 border border-sky-300 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-sky-900 text-center shadow-xs"
                                    }),
                                    /*#__PURE__*/_jsx("span", { className: "text-xs font-bold text-slate-600", children: "วัน" })
                                  ]
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center justify-between text-xs pt-2 border-t border-slate-100",
                              children: [
                                /*#__PURE__*/_jsx("span", { className: "text-slate-500", children: "เกณฑ์ผ่านกิจกรรม (80%):" }),
                                /*#__PURE__*/_jsxs("span", {
                                  className: "font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-md",
                                  children: ["ต้องเข้าแถวอย่างน้อย ", Math.ceil((Number(adminFixedDays) || 65) * 0.8), " วัน"]
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsx("p", {
                              className: "text-[11px] text-slate-400 leading-normal",
                              children: "• ระบบจะปิดการใช้งานปฏิทิน และคำนวณสถิติของนักเรียนทุกคนจากจำนวนวันเกณฑ์นี้โดยตรง"
                            })
                          ]
                        }) : /*#__PURE__*/_jsxs("div", {
                          // CASE 2: ใช้ระบบปฏิทินและวันเปิด-ปิด
                          className: "space-y-3 pt-1",
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  children: [
                                    /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3.5 h-3.5 inline mr-1 text-slate-500" }), "วันเปิดภาคเรียน:"] }),
                                    /*#__PURE__*/_jsx("input", {
                                      type: "date",
                                      value: adminStartDate,
                                      onChange: e => setAdminStartDate(e.target.value),
                                      className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 cursor-pointer shadow-xs"
                                    })
                                  ]
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  children: [
                                    /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: [/*#__PURE__*/_jsx(Icon.Flag, { className: "w-3.5 h-3.5 inline mr-1 text-slate-500" }), "วันปิดภาคเรียน:"] }),
                                    /*#__PURE__*/_jsx("input", {
                                      type: "date",
                                      value: adminEndDate,
                                      onChange: e => setAdminEndDate(e.target.value),
                                      className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-800 cursor-pointer shadow-xs"
                                    })
                                  ]
                                })
                              ]
                            }),

                            /*#__PURE__*/_jsxs("div", {
                              className: "p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950",
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  className: "space-y-0.5",
                                  children: [
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "font-bold flex items-center gap-1.5",
                                      children: [
                                        /*#__PURE__*/_jsx(Icon.Chart, { className: "w-3.5 h-3.5 inline text-slate-600" }),
                                        "วันเรียนที่ผ่านมาแล้ว: ",
                                        /*#__PURE__*/_jsxs("span", { className: "text-sky-800 font-mono font-bold", children: [adminLiveStats.elapsedDays, " วัน"] }),
                                        /*#__PURE__*/_jsxs("span", { className: "text-slate-500 font-normal", children: [" (จากทั้งเทอม ~", adminLiveStats.totalTermDays, " วัน)"] })
                                      ]
                                    }),
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "text-[11px] text-amber-800",
                                      children: [
                                        "วันหยุดพิเศษ: ", (specialHolidays || []).length, " วัน | เรียนชดเชย: ", (compensatoryDays || []).length, " วัน"
                                      ]
                                    })
                                  ]
                                }),
                                /*#__PURE__*/_jsx("button", {
                                  type: "button",
                                  onClick: onOpenCalendarModal,
                                  className: "px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs whitespace-nowrap self-start sm:self-center",
                                  children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3.5 h-3.5 inline mr-1" }), "เปิดปฏิทินตั้งวันหยุด", /*#__PURE__*/_jsx(Icon.ArrowRight, { className: "w-3.5 h-3.5 inline ml-1" })]
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsx("button", {
                      onClick: handleSaveTerm,
                      disabled: savingTerm,
                      className: "w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors mt-2",
                      children: savingTerm ? 'กำลังบันทึก...' : [/*#__PURE__*/_jsx(Icon.Save, { className: "w-3.5 h-3.5 inline mr-1" }), `สลับและบันทึกภาคเรียนที่ ${adminSem}/${adminYear}`]
                    })
                  ]
                }),

                /* Card: จัดการการแสดงผลระดับชั้นปี (เปิด / ซ่อน) */
                /*#__PURE__*/_jsxs("div", {
                  className: "p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        /*#__PURE__*/_jsxs("h3", {
                          className: "text-sm font-bold text-slate-900 flex items-center gap-1.5",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Users, { className: "w-4 h-4 text-indigo-600" }),
                            "เปิด / ซ่อนระดับชั้นปีในระบบ"
                          ]
                        }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "เปิด/ซ่อนระดับชั้นปี",
                          text: "กำหนดระดับชั้นปีที่ต้องการให้แสดงผลหรือซ่อนจากแดชบอร์ดหลัก (เช่น กรณี ปวส.2 ออกฝึกงานภายนอก) โดยข้อมูลนักเรียนในฐานข้อมูลจะไม่สูญหาย"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsx("p", {
                      className: "text-[11px] text-slate-500 leading-relaxed",
                      children: "ชั้นปีที่ถูก 'ซ่อน' จะไม่ถูกนำไปคิดสถิติการมาแถว, KPI รวม, การ์ดแผนก และตารางรายชื่อในหน้าแรก เพื่อความถูกต้องของข้อมูลในแต่ละภาคเรียน"
                    }),
                    /*#__PURE__*/_jsx("div", {
                      className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1",
                      children: ['ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2'].map(lvl => {
                        const count = (termStudentsList || []).filter(s => s.pure_level === lvl).length;
                        const isHidden = localHiddenLevels.includes(lvl);
                        return /*#__PURE__*/_jsxs("div", {
                          key: lvl,
                          className: `p-3 rounded-xl border flex items-center justify-between transition-all ${isHidden ? 'bg-rose-50/80 border-rose-200 shadow-2xs' : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'}`,
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center gap-2.5",
                              children: [
                                /*#__PURE__*/_jsx("span", {
                                  className: `w-2.5 h-2.5 rounded-full ${isHidden ? 'bg-rose-500' : 'bg-emerald-500'}`,
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  children: [
                                    /*#__PURE__*/_jsx("div", {
                                      className: `text-xs font-bold ${isHidden ? 'text-rose-950 line-through' : 'text-slate-800'}`,
                                      children: lvl
                                    }),
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "text-[10px] text-slate-500",
                                      children: [count, " คนในเทอมนี้"]
                                    })
                                  ]
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsx("button", {
                              type: "button",
                              onClick: () => handleToggleHideLevel(lvl),
                              disabled: savingHiddenLevels,
                              className: `px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isHidden ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`,
                              children: isHidden ? "🚫 ซ่อนอยู่ (คลิกเพื่อแสดง)" : "👁️ แสดงอยู่ (คลิกเพื่อซ่อน)"
                            })
                          ]
                        });
                      })
                    })
                  ]
                }),

                // Promotion for New Academic Year
                /*#__PURE__*/_jsxs("div", {
                  className: "p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Academic, { className: "w-5 h-5 text-indigo-700" }),
                            /*#__PURE__*/_jsx("h4", {
                              className: "text-xs font-bold text-indigo-950",
                              children: "เลื่อนระดับชั้นปีนักศึกษาอัตโนมัติ (ขึ้นปีการศึกษาใหม่)"
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "เลื่อนชั้นปีอัตโนมัติ",
                          text: "ใช้เมื่อขึ้นปีการศึกษาใหม่ เพื่อเลื่อนชั้นเด็กเดิมทั้งหมด 1 คลิก: ปวช.1->2, ปวช.2->3, ปวส.1->2 และ ปวช.3/ปวส.2 สำเร็จการศึกษา"
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsxs("div", {
                      className: "bg-white/85 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold text-slate-800",
                          children: [
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md", children: "ปวช.1" }),
                            /*#__PURE__*/_jsx(Icon.ArrowRight, { className: "w-3 h-3 text-slate-400" }),
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md", children: "ปวช.2" }),
                            /*#__PURE__*/_jsx(Icon.ArrowRight, { className: "w-3 h-3 text-slate-400" }),
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md", children: "ปวช.3" }),
                            /*#__PURE__*/_jsx(Icon.ArrowRight, { className: "w-3 h-3 text-slate-400" }),
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md", children: "จบการศึกษา" })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold text-slate-800 pt-1",
                          children: [
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-md", children: "ปวส.1" }),
                            /*#__PURE__*/_jsx(Icon.ArrowRight, { className: "w-3 h-3 text-slate-400" }),
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md", children: "ปวส.2" }),
                            /*#__PURE__*/_jsx(Icon.ArrowRight, { className: "w-3 h-3 text-slate-400" }),
                            /*#__PURE__*/_jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md", children: "จบการศึกษา" })
                          ]
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: handlePromoteStudents,
                      disabled: isPromoting,
                      className: "w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-2",
                      children: [
                        isPromoting ? /*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4" }) : /*#__PURE__*/_jsx(Icon.Academic, { className: "w-4 h-4" }),
                        /*#__PURE__*/_jsx("span", { children: isPromoting ? "กำลังประมวลผลเลื่อนชั้นปี..." : `เริ่มเลื่อนระดับชั้นปีทั้งหมด (เข้าสู่ปี ${adminYear})` })
                      ]
                    })
                  ]
                })
              ]
            }),

            // TAB 2: Student Management (Generic & Clean)
            adminTab === 'students' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4",
              children: [
                // Clean Sub-Navigation
                /*#__PURE__*/_jsxs("div", {
                  className: "flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scroll",
                  children: [
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: () => { handleCancelEdit(); setStudentSubTab('list'); },
                      className: `px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${studentSubTab === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Users, { className: "w-3.5 h-3.5" }),
                        `รายชื่อนักเรียน (${termStudentsList.length})`
                      ]
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: () => { handleCancelEdit(); setStudentSubTab('form'); },
                      className: `px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${studentSubTab === 'form' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5" }),
                        editingStudentId ? 'แก้ไขข้อมูล' : '+ เพิ่มนักเรียน'
                      ]
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: () => setStudentSubTab('excel'),
                      className: `px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${studentSubTab === 'excel' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
                      children: [
                        /*#__PURE__*/_jsx(Icon.Upload, { className: "w-3.5 h-3.5" }),
                        "นำเข้าไฟล์ Excel"
                      ]
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: handleExportStudentsExcel,
                      className: "px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200",
                      title: "ส่งออกข้อมูลนักเรียนของภาคเรียนนี้เป็นไฟล์ Excel (.xlsx)",
                      children: [
                        /*#__PURE__*/_jsx(Icon.Document, { className: "w-3.5 h-3.5 text-emerald-600" }),
                        "ส่งออกไฟล์ Excel"
                      ]
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: () => setStudentSubTab('gradebook_sync'),
                      className: `px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${studentSubTab === 'gradebook_sync' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'}`,
                      title: "ซิงค์และตรวจสอบรหัสนักศึกษากับระบบเช็คชื่อเรียน (Gradebook)",
                      children: [
                        /*#__PURE__*/_jsx(Icon.Refresh, { className: `w-3.5 h-3.5 ${studentSubTab === 'gradebook_sync' ? 'text-white' : 'text-sky-600'}` }),
                        "ซิงค์กับระบบเช็คชื่อเรียน"
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center gap-1.5 ml-auto bg-slate-100 p-1 rounded-xl text-xs font-bold flex-shrink-0",
                      children: [
                        /*#__PURE__*/_jsx("span", { className: "text-slate-500 pl-1 hidden sm:inline", children: "กำลังจัดการ:" }),
                        /*#__PURE__*/_jsxs("select", {
                          value: adminSem,
                          onChange: e => handleAdminSemChange(e.target.value),
                          className: "bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 cursor-pointer",
                          title: "สลับดูและจัดการรายชื่อนักเรียนระหว่างเทอม 1 และเทอม 2",
                          children: [
                            /*#__PURE__*/_jsx("option", { value: "1", children: "เทอม 1" }),
                            /*#__PURE__*/_jsx("option", { value: "2", children: "เทอม 2 (เตรียมล่วงหน้า)" })
                          ]
                        }),
                        /*#__PURE__*/_jsx("span", { className: "text-slate-600 font-mono pr-1", children: "/" + adminYear })
                      ]
                    })
                  ]
                }),

                // VIEW 1: Student Roster List
                studentSubTab === 'list' && /*#__PURE__*/_jsxs("div", {
                  className: "space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex flex-col md:flex-row gap-2 justify-between items-stretch md:items-center bg-slate-50/70 p-2 rounded-2xl border border-slate-200",
                      children: [
                        /* Left: Search & Filter dropdowns */
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex flex-wrap items-center gap-2 flex-1",
                          children: [
                            /* Search input */
                            /*#__PURE__*/_jsx("input", {
                              type: "text",
                              value: studentSearchInput,
                              onChange: e => setStudentSearchInput(e.target.value),
                              placeholder: "ค้นหาชื่อ, รหัส หรือ แผนก...",
                              className: "bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400 w-full sm:w-56"
                            }),
                            /* Dropdown 1: แผนกวิชา */
                            /*#__PURE__*/_jsxs("select", {
                              value: studentDeptFilter,
                              onChange: e => setStudentDeptFilter(e.target.value),
                              className: "bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-2xs flex-1 sm:flex-initial",
                              title: "เลือกแผนกวิชาเพื่อกรองรายชื่อ",
                              children: [
                                /*#__PURE__*/_jsx("option", { value: "ALL", children: `📁 ทุกแผนก (${termStudentsList.length})` }),
                                departmentFilterOptions.map(dept => {
                                  const count = termDepartmentCounts[dept] || 0;
                                  return /*#__PURE__*/_jsx("option", { value: dept, children: `${dept} (${count})` }, dept);
                                })
                              ]
                            }),
                            /* Dropdown 2: ชั้นปี */
                            /*#__PURE__*/_jsxs("select", {
                              value: studentLevelFilter,
                              onChange: e => setStudentLevelFilter(e.target.value),
                              className: "bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-2xs flex-1 sm:flex-initial",
                              title: "เลือกระดับชั้นปีเพื่อกรองรายชื่อ",
                              children: [
                                /*#__PURE__*/_jsx("option", { value: "ALL", children: `🎓 ทุกชั้นปี (${termStudentsList.length})` }),
                                ['ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2'].map(lvl => {
                                  const count = termStudentsList.filter(s => s.pure_level === lvl).length;
                                  const isHidden = localHiddenLevels && localHiddenLevels.includes(lvl);
                                  return /*#__PURE__*/_jsx("option", { value: lvl, children: `${lvl} (${count})${isHidden ? ' [ซ่อนอยู่]' : ''}` }, lvl);
                                })
                              ]
                            }),
                            /* Clear filter button if active */
                            (studentLevelFilter !== 'ALL' || studentDeptFilter !== 'ALL' || studentSearchInput.trim()) && /*#__PURE__*/_jsx("button", {
                              type: "button",
                              onClick: () => {
                                setStudentLevelFilter('ALL');
                                setStudentDeptFilter('ALL');
                                setStudentSearchInput('');
                                setStudentSearch('');
                              },
                              className: "px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap",
                              title: "ล้างตัวกรองทั้งหมด",
                              children: "✕ ล้างตัวกรอง"
                            })
                          ]
                        }),
                        /* Right: Excel Export button */
                        /*#__PURE__*/_jsxs("button", {
                          type: "button",
                          onClick: handleExportStudentsExcel,
                          className: "px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap flex-shrink-0 self-end md:self-auto",
                          title: "ส่งออกข้อมูลนักเรียนของภาคเรียนนี้เป็นไฟล์ Excel (.xlsx)",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Document, { className: "w-3.5 h-3.5 text-emerald-200" }),
                            "ส่งออก Excel"
                          ]
                        })
                      ]
                    }),

                    loadingTermStudents ? /*#__PURE__*/_jsxs("div", {
                      className: "py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2",
                      children: [/*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-sky-600" }), "กำลังดึงรายชื่อนักศึกษา..."]
                    }) : filteredTermStudents.length === 0 ? /*#__PURE__*/_jsxs("div", {
                      className: "py-10 text-center text-xs text-slate-400 space-y-2",
                      children: [
                        /*#__PURE__*/_jsx("p", { children: "ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก" }),
                        /*#__PURE__*/_jsx("button", {
                          type: "button",
                          onClick: () => setStudentSubTab('form'),
                          className: "px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer",
                          children: "+ เพิ่มนักเรียนใหม่"
                        })
                      ]
                    }) : /*#__PURE__*/_jsxs(_Fragment, {
                      children: [
                        /*#__PURE__*/_jsx("div", {
                          className: "max-h-80 overflow-y-auto custom-scroll space-y-1.5 pr-1",
                          children: paginatedTermStudents.map((s, idx) => {
                            const itemIndex = (adminStudentPage - 1) * adminStudentPageSize + idx + 1;
                            const isGrad = s.pure_level === 'สำเร็จการศึกษา';
                            return /*#__PURE__*/_jsxs("div", {
                              key: s.id || idx,
                              className: "p-2.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs transition-colors text-xs",
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  className: "min-w-0 flex items-center gap-2.5",
                                  children: [
                                    /* Sequence Number */
                                    /*#__PURE__*/_jsx("span", { className: "w-5 text-center font-mono text-[11px] text-slate-400 flex-shrink-0", children: itemIndex }),
                                    /* Student Avatar with Photo Click */
                                    (() => {
                                      const sId = String(s.student_id || s.id || '');
                                      const sName = String(s.student_name || s.name || '');
                                      const cleanName = sName.replace(/\s+/g, ' ').trim();
                                      const tightName = sName.replace(/\s+/g, '');
                                      const sPhoto = s.photo_url || s.photoUrl || 
                                                     (studentPhotosMap && (studentPhotosMap[sId] || studentPhotosMap[sName] || studentPhotosMap[cleanName] || 
                                                     Object.entries(studentPhotosMap || {}).find(([k]) => k.replace(/\s+/g, '') === tightName)?.[1]));
                                      return /*#__PURE__*/_jsx("div", {
                                        onClick: () => onOpenStudentPhoto && onOpenStudentPhoto(s),
                                        title: "คลิกเพื่อดูหรือเปลี่ยนรูปถ่ายนักเรียน",
                                        className: "w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center font-bold text-[11px] text-slate-600 select-none cursor-pointer hover:ring-2 hover:ring-indigo-500",
                                        children: sPhoto ? (
                                          /*#__PURE__*/_jsx("img", {
                                            src: sPhoto,
                                            alt: s.student_name,
                                            className: "w-full h-full object-cover"
                                          })
                                        ) : (
                                          (s.student_name || '').replace(/^(?:นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*/g, '').slice(0, 2)
                                        )
                                      });
                                    })(),
                                    /* Student Details */
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "min-w-0",
                                      children: [
                                        /*#__PURE__*/_jsxs("div", {
                                          className: "flex items-center gap-1.5 flex-wrap",
                                          children: [
                                            /*#__PURE__*/_jsx("span", { className: "font-bold text-slate-900 truncate", children: s.student_name }),
                                            (() => {
                                              const sCode = getStudentCode(s);
                                              if (!sCode) return null;
                                              return /*#__PURE__*/_jsx("span", {
                                                className: "font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded font-semibold",
                                                title: `รหัสนักศึกษา: ${sCode}`,
                                                children: sCode
                                              });
                                            })()
                                          ]
                                        }),
                                        /*#__PURE__*/_jsxs("div", {
                                          className: "text-[11px] text-slate-500 flex items-center gap-1.5",
                                          children: [
                                            /*#__PURE__*/_jsx("span", {
                                              className: `font-semibold px-1.5 rounded ${isGrad ? 'bg-slate-200 text-slate-700' : 'bg-indigo-100 text-indigo-800'}`,
                                              children: s.pure_level
                                            }),
                                            /*#__PURE__*/_jsx("span", { children: s.department }),
                                            s.teacher_email && s.teacher_email !== '-' && /*#__PURE__*/_jsxs("span", { className: "text-slate-400 font-mono", children: ["• ", s.teacher_email] }),
                                            s._inherited && /*#__PURE__*/_jsx("span", { className: "text-amber-700 text-[10px] bg-amber-50 px-1 rounded border border-amber-200", children: "เทอม 1" })
                                          ]
                                        })
                                      ]
                                    })
                                  ]
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  className: "flex items-center gap-1.5 flex-shrink-0",
                                  children: [
                                    /*#__PURE__*/_jsx("button", {
                                      type: "button",
                                      onClick: () => onOpenStudentPhoto ? onOpenStudentPhoto(s) : null,
                                      className: "px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1",
                                      children: "📷 รูป"
                                    }),
                                    /*#__PURE__*/_jsx("button", {
                                      type: "button",
                                      onClick: () => handleEditStudentClick(s),
                                      className: "px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer shadow-2xs",
                                      children: "แก้ไข"
                                    }),
                                    /*#__PURE__*/_jsx("button", {
                                      type: "button",
                                      onClick: () => handleDeleteStudent(s),
                                      className: "px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer",
                                      children: "ลบ"
                                    })
                                  ]
                                })
                              ]
                            });
                          })
                        }),
                        /* Pagination bar for admin student list */
                        filteredTermStudents.length > adminStudentPageSize && /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center justify-between pt-2 px-1 text-xs text-slate-500",
                          children: [
                            /*#__PURE__*/_jsxs("span", {
                              children: [
                                `แสดง ${(adminStudentPage - 1) * adminStudentPageSize + 1} - ${Math.min(adminStudentPage * adminStudentPageSize, filteredTermStudents.length)} จากทั้งหมด ${filteredTermStudents.length} คน`
                              ]
                            }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center gap-1.5",
                              children: [
                                /*#__PURE__*/_jsx("button", {
                                  type: "button",
                                  disabled: adminStudentPage <= 1,
                                  onClick: () => setAdminStudentPage(prev => Math.max(1, prev - 1)),
                                  className: "px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all font-medium text-xs shadow-2xs",
                                  children: "‹ ก่อนหน้า"
                                }),
                                /*#__PURE__*/_jsxs("span", {
                                  className: "px-2.5 py-1 bg-slate-100 rounded-lg font-bold text-xs text-slate-800",
                                  children: [adminStudentPage, " / ", adminTotalStudentPages]
                                }),
                                /*#__PURE__*/_jsx("button", {
                                  type: "button",
                                  disabled: adminStudentPage >= adminTotalStudentPages,
                                  onClick: () => setAdminStudentPage(prev => Math.min(adminTotalStudentPages, prev + 1)),
                                  className: "px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all font-medium text-xs shadow-2xs",
                                  children: "ถัดไป ›"
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    })
                  ]
                }),

                // VIEW 2: Add / Edit Student Form
                studentSubTab === 'form' && /*#__PURE__*/_jsxs("div", {
                  className: "p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 max-w-lg mx-auto",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        /*#__PURE__*/_jsx("h4", {
                          className: "text-sm font-bold text-slate-900",
                          children: editingStudentId ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มข้อมูลนักเรียน'
                        }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "ข้อมูลนักเรียน",
                          text: "กรอกข้อมูลนักเรียนเพื่อบันทึกเข้าสู่ภาคเรียนปัจจุบัน สามารถเลือกระดับชั้นและแผนกวิชาได้ตามต้องการ"
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-3",
                      children: [
                        /* Photo Picker */
                        /*#__PURE__*/_jsx(StudentPhotoInput, {
                          photo: newStudentPhoto,
                          onChange: setNewStudentPhoto,
                          studentName: newStudentName,
                          label: editingStudentId ? "แก้ไขรูปประจำตัวนักเรียน" : "รูปประจำตัวนักเรียนใหม่"
                        }),

                        /* Student Code & Student Name */
                        /*#__PURE__*/_jsxs("div", {
                          className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                          children: [
                            /* Student Code */
                            /*#__PURE__*/_jsxs("div", {
                              children: [
                                /*#__PURE__*/_jsxs("label", {
                                  className: "text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between",
                                  children: [
                                    /*#__PURE__*/_jsx("span", { children: "รหัสนักศึกษา (เลขประจำตัว):" }),
                                    /*#__PURE__*/_jsx("span", { className: "text-[10px] text-slate-400 font-normal", children: "10-11 หลัก" })
                                  ]
                                }),
                                /*#__PURE__*/_jsx("input", {
                                  type: "text",
                                  value: newStudentCode,
                                  onChange: e => setNewStudentCode(e.target.value),
                                  placeholder: "เช่น 67201010001 (ถ้ามี)",
                                  maxLength: 15,
                                  className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
                                })
                              ]
                            }),
                            /* Student Name */
                            /*#__PURE__*/_jsxs("div", {
                              children: [
                                /*#__PURE__*/_jsxs("label", {
                                  className: "text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between",
                                  children: [
                                    /*#__PURE__*/_jsx("span", { children: "ชื่อ - นามสกุล:" }),
                                    /*#__PURE__*/_jsx("span", { className: "text-[10px] text-rose-500 font-bold", children: "* จำเป็น" })
                                  ]
                                }),
                                /*#__PURE__*/_jsx("input", {
                                  type: "text",
                                  value: newStudentName,
                                  onChange: e => setNewStudentName(e.target.value),
                                  placeholder: "ชื่อ-นามสกุลนักเรียน...",
                                  className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
                                })
                              ]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              children: [
                                /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: "ระดับชั้น:" }),
                                /*#__PURE__*/_jsxs("select", {
                                  value: newStudentLevel,
                                  onChange: e => setNewStudentLevel(e.target.value),
                                  className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs",
                                  children: [
                                    /*#__PURE__*/_jsx("option", { value: "ปวช.1", children: "ปวช.1" }),
                                    /*#__PURE__*/_jsx("option", { value: "ปวช.2", children: "ปวช.2" }),
                                    /*#__PURE__*/_jsx("option", { value: "ปวช.3", children: "ปวช.3" }),
                                    /*#__PURE__*/_jsx("option", { value: "ปวส.1", children: "ปวส.1" }),
                                    /*#__PURE__*/_jsx("option", { value: "ปวส.2", children: "ปวส.2" }),
                                    /*#__PURE__*/_jsx("option", { value: "สำเร็จการศึกษา", children: "สำเร็จการศึกษา" })
                                  ]
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsxs("div", {
                              children: [
                                /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: "แผนกวิชา:" }),
                                /*#__PURE__*/_jsxs("select", {
                                  value: isCustomStudentDept ? '__custom__' : newStudentDept,
                                  onChange: e => {
                                    if (e.target.value === '__custom__') {
                                      setIsCustomStudentDept(true);
                                      setNewStudentDept('');
                                    } else {
                                      setIsCustomStudentDept(false);
                                      setNewStudentDept(e.target.value);
                                    }
                                  },
                                  className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 cursor-pointer shadow-2xs",
                                  children: [
                                    availableDepartments.map(d => /*#__PURE__*/_jsx("option", { value: d, children: d }, d)),
                                    /*#__PURE__*/_jsx("option", { value: "__custom__", children: "✏️ + ระบุแผนกอื่น (พิมพ์เอง)..." })
                                  ]
                                }),
                                isCustomStudentDept && /*#__PURE__*/_jsx("input", {
                                  type: "text",
                                  value: newStudentDept,
                                  onChange: e => setNewStudentDept(e.target.value),
                                  placeholder: "พิมพ์ชื่อแผนกวิชาใหม่...",
                                  className: "mt-1.5 w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                                })
                              ]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          children: [
                            /*#__PURE__*/_jsx("label", { className: "text-xs font-bold text-slate-700 block mb-1", children: "ครูที่ปรึกษา / อีเมล (ถ้ามี):" }),
                            /*#__PURE__*/_jsx("input", {
                              type: "text",
                              value: newStudentTeacher,
                              onChange: e => setNewStudentTeacher(e.target.value),
                              placeholder: "ชื่อครูที่ปรึกษา หรือ อีเมล...",
                              className: "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
                            })
                          ]
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsxs("div", {
                      className: "flex gap-2 pt-1",
                      children: [
                        /*#__PURE__*/_jsx("button", {
                          type: "button",
                          onClick: handleSaveStudent,
                          disabled: savingStudent,
                          className: "flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors",
                          children: savingStudent ? "กำลังบันทึก..." : (editingStudentId ? "บันทึกการแก้ไข" : "+ บันทึกข้อมูลนักเรียน")
                        }),
                        /*#__PURE__*/_jsx("button", {
                          type: "button",
                          onClick: handleCancelEdit,
                          className: "px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors",
                          children: "ยกเลิก"
                        })
                      ]
                    })
                  ]
                }),

                // VIEW 3: Excel Import — 2-Step: Upload → Preview
                studentSubTab === 'excel' && /*#__PURE__*/_jsxs("div", {
                  className: "space-y-3",
                  children: [
                    // ── STEP 1: Upload ──────────────────────────────────────
                    excelStep === 'upload' && /*#__PURE__*/_jsxs("div", {
                      className: "p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            /*#__PURE__*/_jsxs("h4", {
                              className: "text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5",
                              children: [/*#__PURE__*/_jsx(Icon.Upload, { className: "w-4 h-4 text-slate-600" }), "นำเข้าจาก Excel"]
                            }),
                            /*#__PURE__*/_jsx(InfoTooltip, {
                              title: "นำเข้า Excel",
                              text: "เลือกไฟล์ Excel รายชื่อนักเรียน ระบบจะอ่านชื่อไฟล์และข้อมูลในไฟล์เพื่อตรวจจับระดับชั้นอัตโนมัติ จากนั้นจะแสดงหน้า Preview ให้ตรวจสอบและแก้ไขก่อนยืนยัน"
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx("p", {
                          className: "text-xs text-slate-500",
                          children: "รองรับไฟล์ .xlsx / .xls — ระบบจะตรวจจับระดับชั้นจากชื่อไฟล์อัตโนมัติ"
                        }),
                        /*#__PURE__*/_jsx("input", {
                          type: "file",
                          accept: ".xlsx, .xls, .csv",
                          onChange: handleFileUpload,
                          className: "block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer pt-2"
                        }),
                        importStatusMsg && /*#__PURE__*/_jsx("div", {
                          className: "text-xs font-bold text-emerald-900 bg-white p-2.5 rounded-xl border border-emerald-300",
                          children: importStatusMsg
                        })
                      ]
                    }),

                    // ── STEP 2: Preview ─────────────────────────────────────
                    excelStep === 'preview' && /*#__PURE__*/_jsxs("div", {
                      className: "space-y-3",
                      children: [
                        // Header bar
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            /*#__PURE__*/_jsxs("h4", {
                              className: "text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5",
                              children: [/*#__PURE__*/_jsx(Icon.Document, { className: "w-4 h-4 text-slate-600" }), `ตรวจสอบข้อมูล — ${editableStudents.length} คน`]
                            }),
                            /*#__PURE__*/_jsx("button", {
                              type: "button",
                              onClick: () => { setExcelStep('upload'); setEditableStudents([]); setParsedStudents([]); },
                              className: "text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer",
                              children: "← เลือกไฟล์ใหม่"
                            })
                          ]
                        }),

                        // Override controls
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2",
                          children: [
                            /*#__PURE__*/_jsxs("p", {
                              className: "text-xs font-bold text-amber-800 flex items-center gap-1",
                              children: [/*#__PURE__*/_jsx(Icon.Gear, { className: "w-3.5 h-3.5" }), "ตั้งค่าก่อนนำเข้า (ใช้กับทุกแถว)"]
                            }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "grid grid-cols-2 gap-2",
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  children: [
                                    /*#__PURE__*/_jsx("label", { className: "text-xs text-amber-700 font-semibold block mb-1", children: "ระดับชั้น (override)" }),
                                    /*#__PURE__*/_jsxs("select", {
                                      value: overrideLevel,
                                      onChange: e => setOverrideLevel(e.target.value),
                                      className: "w-full px-2 py-1.5 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400",
                                      children: [
                                        /*#__PURE__*/_jsx("option", { value: "", children: `อัตโนมัติ (${detectedLevel})` }),
                                        ['ปวช.1','ปวช.2','ปวช.3','ปวส.1','ปวส.2','สำเร็จการศึกษา'].map(l =>
                                          /*#__PURE__*/_jsx("option", { value: l, children: l }, l)
                                        )
                                      ]
                                    })
                                  ]
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  children: [
                                    /*#__PURE__*/_jsx("label", { className: "text-xs text-amber-700 font-semibold block mb-1", children: "แผนกวิชา (override)" }),
                                    /*#__PURE__*/_jsxs("select", {
                                      value: overrideDept,
                                      onChange: e => setOverrideDept(e.target.value),
                                      className: "w-full px-2 py-1.5 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400",
                                      children: [
                                        /*#__PURE__*/_jsx("option", { value: "", children: "ใช้จากไฟล์/รหัส" }),
                                        Object.values(DEFAULT_DEPT_CODES).filter((v,i,a) => a.indexOf(v)===i).map(d =>
                                          /*#__PURE__*/_jsx("option", { value: d, children: d }, d)
                                        )
                                      ]
                                    })
                                  ]
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsx("p", {
                              className: "text-xs text-amber-600",
                              children: "เว้นว่างไว้ = ใช้ค่าที่ตรวจจับจากไฟล์ หรือแก้รายคนในตารางด้านล่าง"
                            })
                          ]
                        }),

                        // Preview table
                        /*#__PURE__*/_jsx("div", {
                          className: "border border-slate-200 rounded-2xl overflow-hidden",
                          children: /*#__PURE__*/_jsxs("table", {
                            className: "w-full text-xs",
                            children: [
                              /*#__PURE__*/_jsx("thead", {
                                children: /*#__PURE__*/_jsxs("tr", {
                                  className: "bg-slate-100 text-slate-600",
                                  children: [
                                    /*#__PURE__*/_jsx("th", { className: "px-3 py-2 text-left font-semibold w-8", children: "#" }),
                                    /*#__PURE__*/_jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "ชื่อ-สกุล" }),
                                    /*#__PURE__*/_jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "ระดับชั้น" }),
                                    /*#__PURE__*/_jsx("th", { className: "px-3 py-2 text-left font-semibold", children: "แผนกวิชา" })
                                  ]
                                })
                              }),
                              /*#__PURE__*/_jsx("tbody", {
                                className: "divide-y divide-slate-100 max-h-64 overflow-y-auto",
                                children: editableStudents.slice(0,100).map((s, idx) =>
                                  /*#__PURE__*/_jsxs("tr", {
                                    className: "hover:bg-slate-50",
                                    children: [
                                      /*#__PURE__*/_jsx("td", { className: "px-3 py-1.5 text-slate-400", children: idx + 1 }),
                                      /*#__PURE__*/_jsx("td", { className: "px-3 py-1.5 text-slate-800 font-medium", children: s.full_name || '—' }),
                                      /*#__PURE__*/_jsx("td", {
                                        className: "px-3 py-1.5",
                                        children: /*#__PURE__*/_jsxs("select", {
                                          value: overrideLevel || s.class_level,
                                          onChange: e => {
                                            if (overrideLevel) return; // global override takes priority
                                            const updated = editableStudents.map((r, i) => i === idx ? { ...r, class_level: e.target.value } : r);
                                            setEditableStudents(updated);
                                          },
                                          disabled: !!overrideLevel,
                                          className: "text-xs border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white disabled:opacity-50 disabled:cursor-not-allowed",
                                          children: ['ปวช.1','ปวช.2','ปวช.3','ปวส.1','ปวส.2','สำเร็จการศึกษา'].map(l =>
                                            /*#__PURE__*/_jsx("option", { value: l, children: l }, l)
                                          )
                                        })
                                      }),
                                      /*#__PURE__*/_jsx("td", {
                                        className: "px-3 py-1.5",
                                        children: /*#__PURE__*/_jsxs("select", {
                                          value: overrideDept || s.department,
                                          onChange: e => {
                                            if (overrideDept) return;
                                            const updated = editableStudents.map((r, i) => i === idx ? { ...r, department: e.target.value } : r);
                                            setEditableStudents(updated);
                                          },
                                          disabled: !!overrideDept,
                                          className: "text-xs border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white disabled:opacity-50 disabled:cursor-not-allowed",
                                          children: [
                                            /*#__PURE__*/_jsx("option", { value: s.department, children: s.department }),
                                            ...Object.values(DEFAULT_DEPT_CODES).filter((v,i,a) => a.indexOf(v)===i && v !== s.department).map(d =>
                                              /*#__PURE__*/_jsx("option", { value: d, children: d }, d)
                                            )
                                          ]
                                        })
                                      })
                                    ]
                                  }, idx)
                                )
                              })
                            ]
                          })
                        }),
                        editableStudents.length > 100 && /*#__PURE__*/_jsx("p", {
                          className: "text-xs text-slate-400 text-center",
                          children: `แสดง 100 แถวแรก (ทั้งหมด ${editableStudents.length} คน)`
                        }),

                        // Confirm bar
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center justify-between pt-1",
                          children: [
                            /*#__PURE__*/_jsxs("span", {
                              className: "text-xs text-slate-500",
                              children: [
                                "ระดับชั้นที่จะบันทึก: ",
                                /*#__PURE__*/_jsx("span", {
                                  className: "font-bold text-indigo-700",
                                  children: overrideLevel || detectedLevel
                                }),
                                " · แผนก: ",
                                /*#__PURE__*/_jsx("span", {
                                  className: "font-bold text-indigo-700",
                                  children: overrideDept || "ตามไฟล์/รหัส"
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsx("button", {
                              type: "button",
                              onClick: handleExecuteImport,
                              disabled: isImporting,
                              className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5",
                              children: isImporting ? 'กำลังนำเข้า...' : [/*#__PURE__*/_jsx(Icon.Upload, { className: "w-3.5 h-3.5", key:"ic" }), `ยืนยันนำเข้า ${editableStudents.length} คน`]
                            })
                          ]
                        }),
                        importStatusMsg && /*#__PURE__*/_jsx("div", {
                          className: "text-xs font-bold text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-300",
                          children: importStatusMsg
                        })
                      ]
                    }),

                // VIEW 4: Gradebook Sync Panel
                studentSubTab === 'gradebook_sync' && /*#__PURE__*/_jsxs("div", {
                  className: "p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-3",
                          children: [
                            /*#__PURE__*/_jsx("div", {
                              className: "w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0",
                              children: /*#__PURE__*/_jsx(Icon.Refresh, { className: "w-5 h-5 text-indigo-600" })
                            }),
                            /*#__PURE__*/_jsxs("div", {
                              children: [
                                /*#__PURE__*/_jsx("h4", {
                                  className: "text-sm font-black text-slate-900 tracking-tight",
                                  children: "สถานะการซิงค์รหัสนักศึกษากับระบบเช็คชื่อเรียน (Gradebook)"
                                }),
                                /*#__PURE__*/_jsx("p", {
                                  className: "text-xs text-slate-500",
                                  children: "ตรวจสอบและผูกรหัสนักศึกษา 10-11 หลักจากฐานข้อมูลจริง เพื่อแสดงผลบนแดชบอร์ด"
                                })
                              ]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("button", {
                          type: "button",
                          onClick: () => setStudentSubTab('list'),
                          className: "px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer",
                          children: "← กลับหน้ารายชื่อ"
                        })
                      ]
                    }),
                    (() => {
                      const safeCodes = (studentCodesMap && typeof studentCodesMap === 'object') ? studentCodesMap : {};
                      const matchedCount = termStudentsList.filter(s => Boolean(safeCodes[s.id] || safeCodes[s.student_name] || safeCodes[(s.student_name || '').trim()])).length;
                      return /*#__PURE__*/_jsxs(_Fragment, {
                        children: [
                          /*#__PURE__*/_jsxs("div", {
                            className: "px-3 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1",
                            children: [
                              /*#__PURE__*/_jsxs("div", {
                                className: "flex items-center gap-1.5",
                                children: [
                                  /*#__PURE__*/_jsx(Icon.Info, { className: "w-4 h-4 text-indigo-600 flex-shrink-0" }),
                                  /*#__PURE__*/_jsxs("span", {
                                    children: ["กำลังแสดงผลสำหรับ: ", /*#__PURE__*/_jsx("strong", { children: `ภาคเรียนที่ ${adminSem} ปีการศึกษา ${adminYear}` })]
                                  })
                                ]
                              }),
                              /*#__PURE__*/_jsx("span", {
                                className: "text-[11px] text-slate-500",
                                children: "ผูกรหัสส่วนกลางผ่าน system_settings.student_codes_map"
                              })
                            ]
                          }),
                          /*#__PURE__*/_jsxs("div", {
                            className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                            children: [
                              /*#__PURE__*/_jsxs("div", {
                                className: "p-3.5 bg-white rounded-xl border border-slate-200 text-center",
                                children: [
                                  /*#__PURE__*/_jsx("div", { className: "text-[11px] font-bold text-slate-500", children: `นักเรียนในระบบ (${adminSem}/${adminYear})` }),
                                  /*#__PURE__*/_jsxs("div", { className: "text-xl font-black text-slate-800 mt-1", children: [termStudentsList.length, " คน"] })
                                ]
                              }),
                              /*#__PURE__*/_jsxs("div", {
                                className: "p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center",
                                children: [
                                  /*#__PURE__*/_jsx("div", { className: "text-[11px] font-bold text-emerald-700", children: "ผูกรหัสนักศึกษาแล้ว" }),
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "text-xl font-black text-emerald-800 mt-1",
                                    children: [
                                      matchedCount,
                                      termStudentsList.length > 0 ? ` คน (${Math.round((matchedCount / termStudentsList.length) * 100)}%)` : " คน"
                                    ]
                                  })
                                ]
                              }),
                              /*#__PURE__*/_jsxs("div", {
                                className: "p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-center",
                                children: [
                                  /*#__PURE__*/_jsx("div", { className: "text-[11px] font-bold text-indigo-700", children: "สถานะการซิงค์" }),
                                  /*#__PURE__*/_jsx("div", {
                                    className: "text-base font-black text-indigo-900 mt-1.5",
                                    children: (matchedCount === termStudentsList.length && termStudentsList.length > 0) ? "✅ ครบถ้วน 100%" : "⚡ พร้อมใช้งาน"
                                  })
                                ]
                              })
                            ]
                          }),
                          /*#__PURE__*/_jsxs("div", {
                            className: "p-4 bg-white rounded-xl border border-slate-200 space-y-2",
                            children: [
                              /*#__PURE__*/_jsxs("div", {
                                className: "flex items-center justify-between",
                                children: [
                                  /*#__PURE__*/_jsx("h5", {
                                    className: "text-xs font-bold text-slate-700",
                                    children: "ตัวอย่างรหัสนักศึกษาที่ผูกกับระบบเช็คชื่อแล้ว:"
                                  }),
                                  /*#__PURE__*/_jsxs("span", {
                                    className: "text-[11px] text-slate-400 font-medium",
                                    children: [`แสดง ${Math.min(30, termStudentsList.length)} จาก ${termStudentsList.length} คน`]
                                  })
                                ]
                              }),
                              termStudentsList.length === 0 ? /*#__PURE__*/_jsx("div", {
                                className: "p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg",
                                children: `ยังไม่มีรายชื่อนักเรียนในภาคเรียนที่ ${adminSem}/${adminYear}`
                              }) : /*#__PURE__*/_jsx("div", {
                                className: "max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg text-xs",
                                children: termStudentsList.slice(0, 30).map(s => {
                                  const code = safeCodes[s.id] || safeCodes[s.student_name] || safeCodes[(s.student_name || '').trim()] || '-';
                                  return /*#__PURE__*/_jsxs("div", {
                                    className: "p-2 px-3 flex items-center justify-between hover:bg-slate-50",
                                    children: [
                                      /*#__PURE__*/_jsxs("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                          /*#__PURE__*/_jsx("span", { className: "font-semibold text-slate-800", children: s.student_name }),
                                          /*#__PURE__*/_jsxs("span", { className: "text-[10px] text-slate-400", children: ["(", s.pure_level, " ", s.department, ")"] })
                                        ]
                                      }),
                                      /*#__PURE__*/_jsx("span", {
                                        className: `font-mono font-bold px-2 py-0.5 rounded text-xs ${code !== '-' ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' : 'text-slate-400 bg-slate-100'}`,
                                        children: code
                                      })
                                    ]
                                  }, s.id);
                                })
                              }),
                              termStudentsList.length > 30 && /*#__PURE__*/_jsxs("p", {
                                className: "text-[11px] text-slate-400 text-center pt-1",
                                children: ["แสดง 30 คนแรก จากทั้งหมด ", termStudentsList.length, " คน (มีรหัสในระบบครบ)"]
                              })
                            ]
                          })
                        ]
                      });
                    })()
                  ]
                })
                  ]
                })
              ]
            }),

            // TAB 3: Check-in Logs & Photos
            adminTab === 'logs' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-3",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    /*#__PURE__*/_jsxs("h4", {
                      className: "text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5",
                      children: [
                        /*#__PURE__*/_jsx(Icon.Document, { className: "w-4 h-4 text-slate-600" }),
                        "ประวัติการเช็คชื่อทั้งหมด (", realCheckinSessions.length, " ครั้ง)"
                      ]
                    }),
                    /*#__PURE__*/_jsx(InfoTooltip, {
                      title: "ประวัติการเช็คชื่อ",
                      text: "บันทึกภาพถ่ายหน้าเสาธงและสถิติการมาแถวของแต่ละแผนก จัดเก็บภาพไว้เพื่อตรวจสอบย้อนหลัง"
                    })
                  ]
                }),
                realCheckinSessions.length === 0 ? /*#__PURE__*/_jsxs("div", {
                  className: "py-12 text-center text-slate-400 text-sm",
                  children: [
                    /*#__PURE__*/_jsx(Icon.Document, { className: "w-10 h-10 text-slate-300 mx-auto mb-2" }),
                    "ยังไม่มีข้อมูลประวัติการเช็คชื่อในระบบ"
                  ]
                }) : /*#__PURE__*/_jsx("div", {
                  className: "space-y-2 max-h-80 overflow-y-auto custom-scroll pr-1",
                  children: realCheckinSessions.map(s => /*#__PURE__*/_jsxs("div", {
                    className: "p-3 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 transition-colors",
                    children: [
                      /*#__PURE__*/_jsxs("div", {
                        className: "min-w-0 flex items-center gap-3",
                        children: [
                          s.evidence_photo_url ? /*#__PURE__*/_jsx("img", {
                            src: s.evidence_photo_url,
                            alt: "หลักฐาน",
                            className: "w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          }) : /*#__PURE__*/_jsx("div", {
                            className: "w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-xl flex-shrink-0 font-bold",
                            children: /*#__PURE__*/_jsx(Icon.Document, { className: "w-5 h-5 text-slate-500" })
                          }),
                          /*#__PURE__*/_jsxs("div", {
                            className: "min-w-0",
                            children: [
                              /*#__PURE__*/_jsxs("div", {
                                className: "text-xs font-bold text-slate-900 truncate flex items-center gap-1.5",
                                children: [
                                  s.class_level,
                                  " แผนก",
                                  s.department,
                                  /*#__PURE__*/_jsxs("span", { className: "text-slate-500 font-normal", children: ["(", s.teacher_name, ")"] })
                                ]
                              }),
                              /*#__PURE__*/_jsxs("div", {
                                className: "text-[11px] text-slate-500 flex items-center gap-2 mt-0.5",
                                children: [
                                  /*#__PURE__*/_jsxs("span", { className: "font-mono text-slate-700 font-semibold flex items-center gap-1", children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3 h-3 text-slate-400" }), s.check_date] }),
                                  /*#__PURE__*/_jsxs("span", { className: "text-emerald-700 font-bold", children: ["มา ", s.present_count] }),
                                  /*#__PURE__*/_jsxs("span", { className: "text-rose-600 font-bold", children: ["ขาด ", s.absent_count] }),
                                  /*#__PURE__*/_jsxs("span", { className: "text-amber-600 font-bold", children: ["ลา ", s.leave_count] })
                                ]
                              })
                            ]
                          })
                        ]
                      }),
                      s.evidence_photo_url && /*#__PURE__*/_jsx("a", {
                        href: s.evidence_photo_url,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold cursor-pointer flex-shrink-0",
                        children: [/*#__PURE__*/_jsx(Icon.Search, { className: "w-3 h-3 inline mr-1" }), "ดูรูป"]
                      })
                    ]
                  }, s.id))
                })
              ]
            }),

            // TAB 4: Teachers Management & Compliance Stats
            /* ============================================================== */
            /* TAB: สถิติการส่งยอดเช็คชื่อของครู (Teacher Check-in Stats Tab)   */
            /* ============================================================== */
            adminTab === 'teacher_stats' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4",
              children: [
                /* Header */
                /*#__PURE__*/_jsxs("div", {
                  className: "flex items-center justify-between gap-2 border-b border-slate-200 pb-3 flex-wrap",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      children: [
                        /*#__PURE__*/_jsxs("h3", {
                          className: "text-base font-bold text-slate-900 flex items-center gap-2",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Chart, { className: "w-5 h-5 text-rose-600" }),
                            "สถิติการส่งยอดเช็คชื่อ (ครูที่ปรึกษา)"
                          ]
                        }),
                        /*#__PURE__*/_jsx("p", {
                          className: "text-xs text-slate-500",
                          children: "ตรวจสอบความครอบคลุมการเช็คชื่อเข้าแถวและสถิติสะสมตลอดภาคเรียน"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("button", {
                      type: "button",
                      onClick: handleCopyPendingTeachers,
                      className: "px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all",
                      children: [
                        /*#__PURE__*/_jsx(Icon.Document, { className: "w-3.5 h-3.5" }),
                        isCopiedTeacherList ? "✓ คัดลอกรายชื่อส่ง LINE แล้ว!" : "📋 คัดลอกรายชื่อครูที่ยังไม่เช็ควันนี้"
                      ]
                    })
                  ]
                }),

                /* Inner Stats Dashboard */
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-3.5",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1",
                          children: [
                            /*#__PURE__*/_jsx("span", { className: "text-[11px] font-bold text-slate-500 uppercase", children: "🟢 ส่งยอดแล้ววันนี้" }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-baseline gap-2",
                              children: [
                                /*#__PURE__*/_jsxs("span", { className: "text-2xl font-black text-emerald-600 font-mono", children: [checkedTodayTeachersCount, " / ", teacherStatsList.length] }),
                                /*#__PURE__*/_jsxs("span", { className: "text-xs font-bold text-slate-400 font-mono", children: ["(", teacherStatsList.length > 0 ? Math.round((checkedTodayTeachersCount / teacherStatsList.length) * 100) : 0, "%)"] })
                              ]
                            }),
                            /*#__PURE__*/_jsx("div", { className: "text-[10px] text-slate-400", children: `ประจำวันที่ ${formatThaiDateFull(teacherStatsTodayStr)}` })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1",
                          children: [
                            /*#__PURE__*/_jsx("span", { className: "text-[11px] font-bold text-slate-500 uppercase", children: "🔴 ยังไม่ส่งยอดวันนี้" }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-baseline gap-2",
                              children: [
                                /*#__PURE__*/_jsxs("span", { className: `text-2xl font-black font-mono ${pendingTodayTeachersCount > 0 ? 'text-rose-600' : 'text-slate-700'}`, children: [pendingTodayTeachersCount, " ห้อง"] }),
                                pendingTodayTeachersCount === 0 && /*#__PURE__*/_jsx("span", { className: "text-xs font-bold text-emerald-600", children: "✓ ครบ 100%" })
                              ]
                            }),
                            /*#__PURE__*/_jsx("div", { className: "text-[10px] text-slate-400", children: "รบกวนแอดมินแจ้งเตือนในไลน์กลุ่ม" })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1",
                          children: [
                            /*#__PURE__*/_jsx("span", { className: "text-[11px] font-bold text-slate-500 uppercase", children: "📅 วันเรียนที่เปิดมาแล้ว" }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-baseline gap-2",
                              children: [
                                /*#__PURE__*/_jsxs("span", { className: "text-2xl font-black text-sky-700 font-mono", children: [teacherStatsElapsedDays, " วัน"] }),
                                /*#__PURE__*/_jsx("span", { className: "text-xs font-bold text-slate-400 font-mono", children: "(เกณฑ์ประเมิน % สะสม)" })
                              ]
                            }),
                            /*#__PURE__*/_jsx("div", { className: "text-[10px] text-slate-400", children: "นับตามปฏิทินวันเรียนจริงของวิทยาลัย" })
                          ]
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsxs("div", {
                      className: "p-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-1.5 flex-wrap w-full sm:w-auto",
                          children: [
                            /*#__PURE__*/_jsxs("button", {
                              type: "button",
                              onClick: () => setTeacherStatsFilter('all'),
                              className: `px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                teacherStatsFilter === 'all' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`,
                              children: ["ทั้งหมด (", teacherStatsList.length, ")"]
                            }),
                            /*#__PURE__*/_jsxs("button", {
                              type: "button",
                              onClick: () => setTeacherStatsFilter('pending'),
                              className: `px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                teacherStatsFilter === 'pending' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              }`,
                              children: ["🔴 ยังไม่เช็ค (", pendingTodayTeachersCount, ")"]
                            }),
                            /*#__PURE__*/_jsxs("button", {
                              type: "button",
                              onClick: () => setTeacherStatsFilter('checked'),
                              className: `px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                teacherStatsFilter === 'checked' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`,
                              children: ["🟢 เช็คแล้ว (", checkedTodayTeachersCount, ")"]
                            }),
                            /*#__PURE__*/_jsxs("button", {
                              type: "button",
                              onClick: () => setTeacherStatsFilter('low'),
                              className: `px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                teacherStatsFilter === 'low' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              }`,
                              children: ["⚠️ ต่ำกว่า 80% (", lowComplianceTeachersCount, ")"]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "relative w-full sm:w-64",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Search, { className: "w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" }),
                            /*#__PURE__*/_jsx("input", {
                              type: "text",
                              value: teacherStatsSearch,
                              onChange: e => setTeacherStatsSearch(e.target.value),
                              placeholder: "ค้นหาชื่อครู, แผนก, ชั้นปี...",
                              className: "w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white"
                            })
                          ]
                        })
                      ]
                    }),

                    /*#__PURE__*/_jsx("div", {
                      className: "space-y-2 max-h-[50vh] overflow-y-auto custom-scroll pr-1",
                      children: filteredTeacherStats.length === 0 ? /*#__PURE__*/_jsxs("div", {
                        className: "p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 space-y-1",
                        children: [
                          /*#__PURE__*/_jsx(Icon.Users, { className: "w-8 h-8 mx-auto text-slate-300" }),
                          /*#__PURE__*/_jsx("p", { className: "text-xs font-bold text-slate-600", children: "ไม่พบข้อมูลครูที่ตรงกับเงื่อนไขค้นหา" })
                        ]
                      }) : filteredTeacherStats.map(t => {
                        const hasPhoto = t.todaySession && t.todaySession.evidence_photo_url;
                        return /*#__PURE__*/_jsxs("div", {
                          key: t.id || `${t.name}_${t.class_level}`,
                          className: `p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            t.isCheckedToday
                              ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                              : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                          }`,
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center gap-3 min-w-0",
                              children: [
                                /*#__PURE__*/_jsx("div", {
                                  className: `w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs overflow-hidden ${
                                    t.isCheckedToday ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`,
                                  children: (t.photo_url || teacherPhotosMap?.[t.id] || teacherPhotosMap?.[t.name] || teacherPhotosMap?.[t.name?.replace(/\s+/g, ' ').trim()]) ? (
                                    /*#__PURE__*/_jsx("img", {
                                      src: t.photo_url || teacherPhotosMap[t.id] || teacherPhotosMap[t.name] || teacherPhotosMap[t.name?.replace(/\s+/g, ' ').trim()],
                                      alt: t.name,
                                      className: "w-full h-full object-cover"
                                    })
                                  ) : (
                                    t.isCheckedToday ? /*#__PURE__*/_jsx(Icon.Check, { className: "w-5 h-5 text-emerald-600" }) : "✕"
                                  )
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  className: "min-w-0",
                                  children: [
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "font-bold text-xs text-slate-900 truncate flex items-center gap-1.5",
                                      children: [
                                        t.name,
                                        /*#__PURE__*/_jsx("span", { className: "font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded text-[10px]", children: t.class_level })
                                      ]
                                    }),
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "text-[11px] text-slate-500 truncate flex items-center gap-1.5",
                                      children: [
                                        formatDeptDisplay(t.department),
                                        t.phone && /*#__PURE__*/_jsxs("span", { className: "font-mono text-slate-400", children: ["• ", t.phone] })
                                      ]
                                    })
                                  ]
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100",
                              children: [
                                /*#__PURE__*/_jsxs("div", {
                                  className: "text-right space-y-1 min-w-[110px]",
                                  children: [
                                    /*#__PURE__*/_jsxs("div", {
                                      className: "flex items-center justify-end gap-1.5",
                                      children: [
                                        /*#__PURE__*/_jsxs("span", { className: "text-[11px] font-mono font-bold text-slate-700", children: [t.submittedDays, "/", t.elapsedDays, " วัน"] }),
                                        /*#__PURE__*/_jsxs("span", {
                                          className: `text-[10px] font-bold px-1.5 py-0.2 rounded-md font-mono ${
                                            t.compliancePct >= 80 ? 'bg-emerald-100 text-emerald-800' : (t.compliancePct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                                          }`,
                                          children: [t.compliancePct, "%"]
                                        })
                                      ]
                                    }),
                                    /*#__PURE__*/_jsx("div", {
                                      className: "w-full bg-slate-200 h-1.5 rounded-full overflow-hidden",
                                      children: /*#__PURE__*/_jsx("div", {
                                        className: `h-full rounded-full transition-all ${
                                          t.compliancePct >= 80 ? 'bg-emerald-500' : (t.compliancePct >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                                        }`,
                                        style: { width: `${Math.min(100, t.compliancePct)}%` }
                                      })
                                    })
                                  ]
                                }),
                                /*#__PURE__*/_jsxs("div", {
                                  className: "flex items-center gap-1.5",
                                  children: [
                                    t.isCheckedToday ? (
                                      /*#__PURE__*/_jsxs("span", {
                                        className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap",
                                        children: [
                                          /*#__PURE__*/_jsx(Icon.CheckSimple, { className: "w-3 h-3 text-emerald-600" }),
                                          "เช็คแล้ว",
                                          t.todayTime && /*#__PURE__*/_jsx("span", { className: "font-mono font-normal opacity-75 text-[10px]", children: `(${t.todayTime})` })
                                        ]
                                      })
                                    ) : (
                                      /*#__PURE__*/_jsxs("span", {
                                        className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs whitespace-nowrap",
                                        children: [
                                          /*#__PURE__*/_jsx(Icon.Alert, { className: "w-3 h-3 text-rose-600" }),
                                          "ยังไม่ส่งยอด"
                                        ]
                                      })
                                    ),
                                    hasPhoto && /*#__PURE__*/_jsx("button", {
                                      type: "button",
                                      onClick: () => setViewingEvidencePhoto(t.todaySession.evidence_photo_url),
                                      title: "ดูภาพถ่ายหน้าเสาธงของห้องนี้",
                                      className: "p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg cursor-pointer transition-colors shadow-2xs",
                                      children: /*#__PURE__*/_jsx(Icon.Camera, { className: "w-3.5 h-3.5 text-sky-700" })
                                    })
                                  ]
                                })
                              ]
                            })
                          ]
                        });
                      })
                    }),

                    viewingEvidencePhoto && /*#__PURE__*/_jsx("div", {
                      className: "fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs",
                      onClick: () => setViewingEvidencePhoto(null),
                      children: /*#__PURE__*/_jsxs("div", {
                        className: "bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3 p-4",
                        onClick: e => e.stopPropagation(),
                        children: [
                          /*#__PURE__*/_jsxs("div", {
                            className: "flex justify-between items-center",
                            children: [
                              /*#__PURE__*/_jsx("h4", { className: "text-xs font-bold text-slate-800", children: "ภาพถ่ายหลักฐานหน้าเสาธง" }),
                              /*#__PURE__*/_jsx("button", {
                                type: "button",
                                onClick: () => setViewingEvidencePhoto(null),
                                className: "text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer",
                                children: "✕"
                              })
                            ]
                          }),
                          /*#__PURE__*/_jsx("img", {
                            src: viewingEvidencePhoto,
                            alt: "Evidence",
                            className: "w-full max-h-[65vh] object-contain rounded-xl bg-slate-950"
                          })
                        ]
                      })
                    })
                  ]
                })
              ]
            }),

            /* ============================================================== */
            /* TAB: จัดการข้อมูลครูที่ปรึกษา & PIN (Teacher Management Tab)     */
            /* ============================================================== */
            adminTab === 'teachers' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex justify-between items-center",
                      children: [
                        /*#__PURE__*/_jsx("h4", { className: "text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5", children: [/*#__PURE__*/_jsx(Icon.Plus, { className: "w-3.5 h-3.5 text-emerald-600" }), "เพิ่มครูที่ปรึกษาประจำแผนก"] }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "ครูที่ปรึกษา",
                          text: "กำหนดครูประจำแผนกและระดับชั้น และตั้งรหัส PIN ประจำห้อง 6 หลัก (เช่น 201010) สำหรับให้ครูใช้เข้าสู่ระบบเช็คชื่อ"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-4 gap-2",
                      children: [
                        /*#__PURE__*/_jsx("input", {
                          type: "text",
                          value: newTeacherName,
                          onChange: e => setNewTeacherName(e.target.value),
                          placeholder: "ชื่อ-นามสกุลครู...",
                          className: "bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:col-span-2 focus:outline-none focus:border-sky-400"
                        }),
                        /*#__PURE__*/_jsxs("select", {
                          value: isCustomTeacherDept ? '__custom__' : newTeacherDept,
                          onChange: e => {
                            if (e.target.value === '__custom__') {
                              setIsCustomTeacherDept(true);
                              setNewTeacherDept('');
                            } else {
                              setIsCustomTeacherDept(false);
                              setNewTeacherDept(e.target.value);
                            }
                          },
                          className: "bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs cursor-pointer font-medium text-slate-800",
                          children: [
                            availableDepartments.map(d => /*#__PURE__*/_jsx("option", { value: d, children: d }, d)),
                            /*#__PURE__*/_jsx("option", { value: "__custom__", children: "✏️ + ระบุแผนกอื่น (พิมพ์เอง)..." })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("select", {
                          value: newTeacherLevel,
                          onChange: e => setNewTeacherLevel(e.target.value),
                          className: "bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs cursor-pointer",
                          children: [
                            /*#__PURE__*/_jsx("option", { value: "ปวช.1", children: "ปวช.1" }),
                            /*#__PURE__*/_jsx("option", { value: "ปวช.2", children: "ปวช.2" }),
                            /*#__PURE__*/_jsx("option", { value: "ปวช.3", children: "ปวช.3" }),
                            /*#__PURE__*/_jsx("option", { value: "ปวส.1", children: "ปวส.1" }),
                            /*#__PURE__*/_jsx("option", { value: "ปวส.2", children: "ปวส.2" })
                          ]
                        }),
                        isCustomTeacherDept && /*#__PURE__*/_jsx("input", {
                          type: "text",
                          value: newTeacherDept,
                          onChange: e => setNewTeacherDept(e.target.value),
                          placeholder: "พิมพ์ชื่อแผนกวิชาใหม่...",
                          className: "bg-amber-50 border border-amber-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold sm:col-span-4 shadow-2xs placeholder:text-amber-400"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex flex-col sm:flex-row gap-2",
                      children: [
                        /*#__PURE__*/_jsx("input", {
                          type: "text",
                          value: newTeacherPhone,
                          onChange: e => setNewTeacherPhone(e.target.value),
                          placeholder: "เบอร์โทรศัพท์ (ถ้ามี)...",
                          className: "flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400"
                        }),
                        /*#__PURE__*/_jsx("input", {
                          type: "text",
                          maxLength: 6,
                          value: newTeacherPin,
                          onChange: e => setNewTeacherPin(e.target.value.replace(/\D/g, '').slice(0, 6)),
                          placeholder: "รหัสห้อง 6 หลัก (เช่น 201010)...",
                          className: "sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-sky-400 text-emerald-800"
                        }),
                        /*#__PURE__*/_jsx("button", {
                          onClick: handleAddTeacher,
                          disabled: savingTeacher,
                          className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs whitespace-nowrap",
                          children: savingTeacher ? 'กำลังเพิ่ม...' : '+ เพิ่มครูที่ปรึกษา'
                        })
                      ]
                    })
                  ]
                }),

                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-2",
                  children: [
                    /*#__PURE__*/_jsx("h4", { className: "text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5", children: [/*#__PURE__*/_jsx(Icon.Users, { className: "w-3.5 h-3.5 text-slate-600" }), "รายชื่อครูที่ปรึกษาในระบบ"] }),
                    /*#__PURE__*/_jsx("div", {
                      className: "space-y-2 max-h-64 overflow-y-auto custom-scroll pr-1",
                      children: teachers.length === 0 ? /*#__PURE__*/_jsxs("div", {
                        className: "p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400 space-y-1",
                        children: [
                          /*#__PURE__*/_jsx(Icon.Users, { className: "w-8 h-8 mx-auto text-slate-300 mb-1" }),
                          /*#__PURE__*/_jsx("p", { className: "text-xs font-bold text-slate-600", children: "ยังไม่มีรายชื่อครูที่ปรึกษาในระบบ" }),
                          /*#__PURE__*/_jsx("p", { className: "text-[11px] text-slate-400", children: "คุณสามารถเพิ่มครูที่ปรึกษาประจำแผนกได้จากฟอร์มด้านบน" })
                        ]
                      }) : teachers.map(t => /*#__PURE__*/_jsxs("div", {
                        className: "p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs",
                        children: [
                          /*#__PURE__*/_jsxs("div", {
                            className: "min-w-0 flex items-center gap-2.5",
                            children: [
                              /*#__PURE__*/_jsx("div", {
                                onClick: () => onOpenTeacherPhoto && onOpenTeacherPhoto(t),
                                title: "คลิกเพื่อดูหรือเปลี่ยนรูปถ่ายครู",
                                className: `w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-sky-400 transition-all select-none shadow-2xs`,
                                children: (t.photo_url || teacherPhotosMap?.[t.id] || teacherPhotosMap?.[t.name] || teacherPhotosMap?.[t.name?.replace(/\s+/g, ' ').trim()]) ? (
                                  /*#__PURE__*/_jsx("img", {
                                    src: t.photo_url || teacherPhotosMap[t.id] || teacherPhotosMap[t.name] || teacherPhotosMap[t.name?.replace(/\s+/g, ' ').trim()],
                                    alt: t.name,
                                    className: "w-full h-full object-cover"
                                  })
                                ) : (
                                  /*#__PURE__*/_jsx(Icon.Users, { className: "w-4 h-4 text-sky-600" })
                                )
                              }),
                              /*#__PURE__*/_jsxs("div", {
                                className: "min-w-0",
                                children: [
                                  /*#__PURE__*/_jsx("div", { className: "text-xs font-bold text-slate-900 truncate", children: t.name }),
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "text-[11px] text-slate-500 flex items-center gap-1.5",
                                    children: [
                                      /*#__PURE__*/_jsx("span", { className: "font-semibold text-sky-800 bg-sky-50 px-1.5 rounded", children: t.class_level }),
                                      /*#__PURE__*/_jsxs("span", { children: [formatDeptDisplay(t.department)] }),
                                      t.phone && /*#__PURE__*/_jsxs("span", { className: "font-mono text-slate-400", children: ["• ", t.phone] })
                                    ]
                                  })
                                ]
                              })
                            ]
                          }),
                          /*#__PURE__*/_jsxs("div", {
                            className: "flex items-center gap-1.5 flex-shrink-0",
                            children: [
                              /*#__PURE__*/_jsxs("button", {
                                onClick: () => onOpenTeacherPhoto && onOpenTeacherPhoto(t),
                                title: "เปลี่ยนรูปถ่ายครู",
                                className: "px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-semibold cursor-pointer",
                                children: [/*#__PURE__*/_jsx(Icon.Camera, { className: "w-3 h-3 inline mr-1" }), "รูป"]
                              }),
                              /*#__PURE__*/_jsxs("button", {
                                onClick: () => handleSetTeacherPin(t.id, t.name, t.department, t.class_level),
                                title: "กำหนดรหัสประจำห้อง 6 หลัก",
                                className: "px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold cursor-pointer",
                                children: [/*#__PURE__*/_jsx(Icon.Key, { className: "w-3 h-3 inline mr-1" }), "ตั้งรหัส 6 หลัก"]
                              }),
                              /*#__PURE__*/_jsxs("button", {
                                onClick: () => handleDeleteTeacher(t.id, t.name),
                                className: "px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer",
                                children: [/*#__PURE__*/_jsx(Icon.Trash, { className: "w-3 h-3 inline mr-1" }), "ลบ"]
                              })
                            ]
                          })
                        ]
                      }, t.id || t.name))
                    })
                  ]
                })
              ]
            }),

            // TAB 5: General Settings (เกณฑ์วันเข้าแถว)
            adminTab === 'general' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex justify-between items-center",
                      children: [
                        /*#__PURE__*/_jsxs("span", {
                          className: "text-xs font-bold text-slate-700 flex items-center gap-1.5",
                          children: [/*#__PURE__*/_jsx(Icon.Calendar, { className: "w-3.5 h-3.5 text-slate-500" }), "กำหนดเกณฑ์จำนวนวันเข้าแถวทั้งหมด (ทั้งระบบ)"]
                        }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "เกณฑ์วันเข้าแถว",
                          text: "จำนวนวันเข้าแถวรวมที่ใช้เป็นฐานคิดร้อยละ (เช่น 65 วัน หรือคิดอัตโนมัติตามปฏิทิน)"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex gap-2 pt-1",
                      children: [
                        /*#__PURE__*/_jsx("input", {
                          type: "number",
                          value: days,
                          onChange: e => setDays(Number(e.target.value)),
                          className: "flex-1 bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 font-mono"
                        }),
                        /*#__PURE__*/_jsx("button", {
                          onClick: handleSaveDays,
                          disabled: savingDays,
                          className: "py-2 px-4 bg-slate-900 text-white font-medium text-xs rounded-xl cursor-pointer disabled:opacity-50",
                          children: savingDays ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์วัน'
                        })
                      ]
                    })
                  ]
                }),

                /* ปลดล็อกอนุญาตให้ครูเช็คชื่อนอกเวลา (Admin Bypass / วันกิจกรรมพิเศษ) */
                /*#__PURE__*/_jsxs("div", {
                  className: "p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-start justify-between gap-3",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "space-y-1",
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center gap-1.5",
                              children: [
                                /*#__PURE__*/_jsx("span", { className: "text-amber-800 text-sm", children: "⚡" }),
                                /*#__PURE__*/_jsx("h4", {
                                  className: "text-xs font-bold text-amber-950",
                                  children: "ปลดล็อกอนุญาตให้ครูเช็คชื่อนอกเวลา (Admin Bypass / วันกิจกรรมพิเศษ)"
                                }),
                                /*#__PURE__*/_jsx(InfoTooltip, {
                                  title: "Admin Bypass เช็คชื่อนอกเวลา",
                                  text: "เมื่อเปิดใช้งาน คุณครูสามารถเช็คชื่อและส่งภาพถ่ายได้ตลอดเวลาโดยไม่มีการล็อกปุ่มสีเทา ไม่จำกัดเฉพาะ 07:35 - 08:20 น."
                                })
                              ]
                            }),
                            /*#__PURE__*/_jsx("p", {
                              className: "text-[11px] text-amber-800/90 leading-relaxed",
                              children: "เมื่อเปิดใช้งาน คุณครูจะสามารถเช็คชื่อได้ตลอดเวลาโดยไม่มีการล็อกปุ่มสีเทา (เหมาะสำหรับวันกิจกรรมพิเศษ, งานพิธีสำคัญ หรือกรณีมีเหตุขัดข้อง)"
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("label", {
                          className: "relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5",
                          children: [
                            /*#__PURE__*/_jsx("input", {
                              type: "checkbox",
                              checked: localAllowOffHours,
                              onChange: e => handleToggleOffHours(e.target.checked),
                              disabled: savingOffHours,
                              className: "sr-only peer"
                            }),
                            /*#__PURE__*/_jsx("div", {
                              className: "w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"
                            })
                          ]
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "text-[11px] text-amber-900 flex items-center justify-between pt-2 border-t border-amber-200/60 font-medium",
                      children: [
                        /*#__PURE__*/_jsxs("span", {
                          className: "flex items-center gap-1",
                          children: [
                            /*#__PURE__*/_jsx("span", { children: "สถานะปัจจุบัน:" }),
                            /*#__PURE__*/_jsx("strong", {
                              className: localAllowOffHours ? "text-emerald-700 font-bold" : "text-slate-600 font-bold",
                              children: localAllowOffHours ? "🟢 ปลดล็อกอยู่ (คุณครูเช็คชื่อได้ตลอดเวลา)" : "🔒 บังคับเวลาปกติ (เปิดระบบ 07:35 - 08:20 น.)"
                            })
                          ]
                        }),
                        savingOffHours && /*#__PURE__*/_jsxs("span", {
                          className: "text-amber-700 flex items-center gap-1 text-[10px]",
                          children: [/*#__PURE__*/_jsx(Icon.Spin, { className: "w-3 h-3" }), "กำลังบันทึก..."]
                        })
                      ]
                    })
                  ]
                }),

                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-2",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex justify-between items-center",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-1",
                          children: [
                            /*#__PURE__*/_jsx("h3", {
                              className: "text-xs font-bold text-slate-700 uppercase",
                              children: "เกณฑ์และแนวทางการแก้ไข (เข้าแถว)"
                            }),
                            /*#__PURE__*/_jsx(InfoTooltip, {
                              title: "เกณฑ์เปอร์เซ็นต์",
                              text: "กำหนดช่วงเปอร์เซ็นต์และแนวทางการแก้ไข เช่น <80% ต้องทำกิจกรรมชดเชยตามข้อกำหนด"
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx("button", {
                          onClick: () => setRuleList([...ruleList, {
                            min_percent: 0,
                            max_percent: 79,
                            remedy_text: '',
                            rule_type: 'attendance'
                          }]),
                          className: "text-xs text-emerald-700 font-semibold cursor-pointer",
                          children: "+ เพิ่มเกณฑ์"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsx("div", {
                      className: "space-y-2",
                      children: ruleList.map((r, i) => /*#__PURE__*/_jsxs("div", {
                        className: "flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200",
                        children: [
                          /*#__PURE__*/_jsx("input", {
                            type: "number",
                            value: r.min_percent,
                            onChange: e => {
                              const up = [...ruleList];
                              up[i].min_percent = Number(e.target.value);
                              setRuleList(up);
                            },
                            className: "w-14 bg-white border border-slate-200 text-xs text-center py-1 rounded"
                          }),
                          /*#__PURE__*/_jsx("span", { children: "-" }),
                          /*#__PURE__*/_jsx("input", {
                            type: "number",
                            value: r.max_percent,
                            onChange: e => {
                              const up = [...ruleList];
                              up[i].max_percent = Number(e.target.value);
                              setRuleList(up);
                            },
                            className: "w-14 bg-white border border-slate-200 text-xs text-center py-1 rounded"
                          }),
                          /*#__PURE__*/_jsx("input", {
                            type: "text",
                            value: r.remedy_text,
                            onChange: e => {
                              const up = [...ruleList];
                              up[i].remedy_text = e.target.value;
                              setRuleList(up);
                            },
                            className: "flex-1 bg-white border border-slate-200 text-xs px-2 py-1 rounded"
                          }),
                          /*#__PURE__*/_jsx("button", {
                            onClick: () => setRuleList(ruleList.filter((_, idx) => idx !== i)),
                            className: "text-slate-400 hover:text-rose-600 px-1 cursor-pointer",
                            children: /*#__PURE__*/_jsx(Icon.Close, { className: "w-5 h-5 text-slate-400 hover:text-slate-600" })
                          })
                        ]
                      }, i))
                    }),
                    /*#__PURE__*/_jsx("button", {
                      onClick: handleSaveRules,
                      disabled: savingRules,
                      className: "w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50",
                      children: savingRules ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์เงื่อนไข'
                    })
                  ]
                })
              ]
            }),

            // TAB 6: Storage Quota & Term Cleanup
            adminTab === 'storage' && /*#__PURE__*/_jsxs("div", {
              className: "space-y-4 py-1",
              children: [
                // Top Storage Bar Card
                /*#__PURE__*/_jsxs("div", {
                  className: "p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-md space-y-4 border border-slate-800",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex justify-between items-start gap-3",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          children: [
                            /*#__PURE__*/_jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                /*#__PURE__*/_jsx(Icon.Shield, { className: "w-5 h-5 text-indigo-400" }),
                                /*#__PURE__*/_jsx("h3", {
                                  className: "text-sm sm:text-base font-bold",
                                  children: "สถานะพื้นที่จัดเก็บฐานข้อมูล (Supabase)"
                                }),
                                /*#__PURE__*/_jsx(InfoTooltip, {
                                  title: "พื้นที่จัดเก็บ & โควตา",
                                  text: "โควตาฟรี Supabase มี 500 MB แนะนำเลือกล้างเฉพาะรูปถ่ายของเทอมเก่าเพื่อคืนพื้นที่ 95% โดยข้อมูลสถิติคะแนนยังคงอยู่ครบถ้วน"
                                })
                              ]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx("button", {
                          type: "button",
                          onClick: fetchStorageStats,
                          disabled: loadingStorage,
                          className: "p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer transition-colors flex items-center gap-1",
                          title: "รีเฟรชข้อมูลพื้นที่",
                          children: loadingStorage ? /*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-white" }) : /*#__PURE__*/_jsx(Icon.Refresh, { className: "w-4 h-4 text-white" })
                        })
                      ]
                    }),

                    // Quota bar
                    /*#__PURE__*/_jsxs("div", {
                      className: "space-y-2",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex justify-between text-xs font-mono",
                          children: [
                            /*#__PURE__*/_jsxs("span", {
                              className: "font-bold " + storageStatusColor,
                              children: ["ใช้ไป: ", storageUsedMb, " MB / ", storageMaxMb, " MB (", storagePct, "%)"]
                            }),
                            /*#__PURE__*/_jsxs("span", {
                              className: "text-slate-400",
                              children: ["เหลือพื้นที่: ", Math.max(0, Number((storageMaxMb - storageUsedMb).toFixed(2))), " MB"]
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx("div", {
                          className: "w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5",
                          children: /*#__PURE__*/_jsx("div", {
                            className: "h-full rounded-full transition-all duration-500 " + storageBarColor,
                            style: { width: Math.max(2, storagePct) + "%" }
                          })
                        }),
                        storagePct >= 80 && /*#__PURE__*/_jsxs("div", {
                          className: "p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center gap-2 text-xs text-rose-200 mt-2",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Alert, { className: "w-4 h-4 text-rose-400 flex-shrink-0" }),
                            /*#__PURE__*/_jsx("span", {
                              children: "แจ้งเตือน: พื้นที่ใกล้แตะโควตา 500 MB แนะนำให้กด 'ล้างเฉพาะรูปถ่าย' ของเทอมเก่าด้านล่างเพื่อคืนพื้นที่ทันที"
                            })
                          ]
                        })
                      ]
                    }),

                    // Metrics Badges
                    /*#__PURE__*/_jsxs("div", {
                      className: "grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-2 rounded-xl bg-white/5",
                          children: [
                            /*#__PURE__*/_jsx("div", { className: "text-[11px] text-slate-400", children: "รูปถ่ายหลักฐาน" }),
                            /*#__PURE__*/_jsxs("div", { className: "text-sm sm:text-base font-bold font-mono text-indigo-300", children: [storageStats?.total_photos || 0, " รูป"] })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-2 rounded-xl bg-white/5",
                          children: [
                            /*#__PURE__*/_jsx("div", { className: "text-[11px] text-slate-400", children: "รอบเช็คชื่อทั้งหมด" }),
                            /*#__PURE__*/_jsxs("div", { className: "text-sm sm:text-base font-bold font-mono text-sky-300", children: [storageStats?.total_sessions || 0, " รอบ"] })
                          ]
                        }),
                        /*#__PURE__*/_jsxs("div", {
                          className: "p-2 rounded-xl bg-white/5",
                          children: [
                            /*#__PURE__*/_jsx("div", { className: "text-[11px] text-slate-400", children: "นักเรียนในระบบ" }),
                            /*#__PURE__*/_jsxs("div", { className: "text-sm sm:text-base font-bold font-mono text-emerald-300", children: [storageStats?.total_students || 0, " คน"] })
                          ]
                        })
                      ]
                    })
                  ]
                }),

                // Full Backup & Restore Card
                /*#__PURE__*/_jsxs("div", {
                  className: "p-4 sm:p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex justify-between items-center",
                      children: [
                        /*#__PURE__*/_jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            /*#__PURE__*/_jsx(Icon.Shield, { className: "w-5 h-5 text-emerald-600" }),
                            /*#__PURE__*/_jsx("h3", {
                              className: "text-sm sm:text-base font-bold text-slate-900",
                              children: "สำรอง & กู้คืนข้อมูลระบบ (Full Backup & Restore)"
                            })
                          ]
                        }),
                        /*#__PURE__*/_jsx(InfoTooltip, {
                          title: "สำรองและกู้คืนข้อมูล",
                          text: "ดาวน์โหลดข้อมูลทุกตารางในฐานข้อมูลเป็นไฟล์ JSON เก็บไว้บนคอมพิวเตอร์ของคุณ และสามารถนำไฟล์มากู้คืนข้อมูลทั้งหมดกลับเข้าสู่ระบบได้ตลอดเวลา"
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsx("p", {
                      className: "text-xs text-slate-500",
                      children: "สำรองข้อมูลครอบคลุมทั้ง: รายชื่อนักเรียน, สถิติการเข้าแถว, ประวัติเช็คชื่อรายวัน, บันทึกการเข้าแถวและรูปถ่าย, ครูที่ปรึกษา และการตั้งค่าระบบทั้งหมด"
                    }),
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex flex-col sm:flex-row gap-2.5 pt-1",
                      children: [
                        /*#__PURE__*/_jsxs("button", {
                          type: "button",
                          onClick: handleExportFullBackup,
                          disabled: isExportingBackup || isRestoringBackup,
                          className: "flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-all",
                          children: [
                            isExportingBackup
                              ? /*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-white" })
                              : /*#__PURE__*/_jsx(Icon.Save, { className: "w-4 h-4 text-white" }),
                            isExportingBackup ? "กำลังส่งออกข้อมูล..." : "📦 สำรองข้อมูลทั้งหมด (ดาวน์โหลด JSON)"
                          ]
                        }),
                        /*#__PURE__*/_jsxs("button", {
                          type: "button",
                          onClick: () => backupFileInputRef.current && backupFileInputRef.current.click(),
                          disabled: isExportingBackup || isRestoringBackup,
                          className: "flex-1 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 text-indigo-900 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 transition-all",
                          children: [
                            isRestoringBackup
                              ? /*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-indigo-600" })
                              : /*#__PURE__*/_jsx(Icon.Upload, { className: "w-4 h-4 text-indigo-600" }),
                            isRestoringBackup ? "กำลังกู้คืนข้อมูล..." : "📥 กู้คืนข้อมูล (เลือกไฟล์ JSON)"
                          ]
                        }),
                        /*#__PURE__*/_jsx("input", {
                          ref: backupFileInputRef,
                          type: "file",
                          accept: ".json",
                          onChange: handleRestoreFullBackup,
                          className: "hidden"
                        })
                      ]
                    })
                  ]
                }),

                // Breakdown by Term
                /*#__PURE__*/_jsxs("div", {
                  className: "space-y-3",
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex justify-between items-center",
                      children: [
                        /*#__PURE__*/_jsx("h4", {
                          className: "text-xs font-bold text-slate-700 uppercase tracking-wider",
                          children: "ข้อมูลและตัวเลือกล้างข้อมูลแยกตามภาคเรียน"
                        }),
                        /*#__PURE__*/_jsx("span", {
                          className: "text-[11px] text-slate-500",
                          children: "เทอมปัจจุบันถูกล็อกไว้เพื่อความปลอดภัย"
                        })
                      ]
                    }),

                    loadingStorage ? /*#__PURE__*/_jsxs("div", {
                      className: "p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2",
                      children: [
                        /*#__PURE__*/_jsx(Icon.Spin, { className: "w-4 h-4 text-sky-600" }),
                        "กำลังคำนวณขนาดพื้นที่จัดเก็บ..."
                      ]
                    }) : (storageStats?.terms || []).map(t => {
                      const isProtected = t.is_active || 
                        (String(t.academic_year) > String(academicYear)) || 
                        (String(t.academic_year) === String(academicYear) && Number(t.semester) >= Number(semester)) ||
                        (String(t.academic_year) === String(adminYear) && String(t.semester) === String(adminSem));
                      const isCleaning = cleaningTerm && cleaningTerm.startsWith(t.semester + '/' + t.academic_year);
                      const photoSizeMb = Number(((t.photo_count * 180) / 1024).toFixed(2));

                      return /*#__PURE__*/_jsxs("div", {
                        className: "p-4 rounded-2xl border transition-all " + (isProtected ? "bg-sky-50/60 border-sky-300 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300"),
                        children: [
                          /*#__PURE__*/_jsxs("div", {
                            className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                            children: [
                              /*#__PURE__*/_jsxs("div", {
                                className: "space-y-1",
                                children: [
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      /*#__PURE__*/_jsxs("h5", {
                                        className: "text-sm font-bold text-slate-900",
                                        children: ["ภาคเรียนที่ ", t.semester, "/", t.academic_year]
                                      }),
                                      t.is_active ? /*#__PURE__*/_jsx("span", {
                                        className: "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200",
                                        children: "ภาคเรียนปัจจุบัน (เปิดใช้งาน)"
                                      }) : isProtected ? /*#__PURE__*/_jsx("span", {
                                        className: "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200",
                                        children: "ภาคเรียนที่กำลังเตรียมข้อมูล"
                                      }) : /*#__PURE__*/_jsx("span", {
                                        className: "px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200",
                                        children: "ภาคเรียนเก่า"
                                      })
                                    ]
                                  }),
                                  /*#__PURE__*/_jsxs("div", {
                                    className: "text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 font-mono",
                                    children: [
                                      /*#__PURE__*/_jsxs("span", { children: ["นักเรียน: ", t.student_count, " คน"] }),
                                      /*#__PURE__*/_jsx("span", { children: "•" }),
                                      /*#__PURE__*/_jsxs("span", { children: ["เช็คชื่อ: ", t.session_count, " รอบ"] }),
                                      /*#__PURE__*/_jsx("span", { children: "•" }),
                                      /*#__PURE__*/_jsxs("span", {
                                        className: t.photo_count > 0 ? "font-bold text-indigo-700" : "",
                                        children: ["รูปหลักฐาน: ", t.photo_count, " รูป (~", photoSizeMb, " MB)"]
                                      })
                                    ]
                                  })
                                ]
                              }),

                              /*#__PURE__*/_jsx("div", {
                                className: "flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0",
                                children: isProtected ? /*#__PURE__*/_jsxs("div", {
                                  className: "px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200",
                                  title: "ไม่อนุญาตให้ลบภาคเรียนปัจจุบัน หรือภาคเรียนที่กำลังเตรียมข้อมูลล่วงหน้า",
                                  children: [
                                    /*#__PURE__*/_jsx(Icon.Lock, { className: "w-3 h-3 text-slate-400" }),
                                    t.is_active ? "ล็อกความปลอดภัย (เทอมปัจจุบัน)" : "ล็อกความปลอดภัย (เตรียมข้อมูลล่วงหน้า)"
                                  ]
                                }) : /*#__PURE__*/_jsxs("div", {
                                  className: "flex gap-2",
                                  children: [
                                    /*#__PURE__*/_jsxs("button", {
                                      type: "button",
                                      onClick: () => handleCleanupTerm(t.academic_year, t.semester, 'photos_only'),
                                      disabled: isCleaning || t.photo_count === 0,
                                      className: "px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors flex items-center gap-1",
                                      title: "ลบเฉพาะรูปหลักฐาน Base64 ออก คืนพื้นที่ 95% โดยสถิติยังคงอยู่",
                                      children: [
                                        /*#__PURE__*/_jsx(Icon.Trash, { className: "w-3.5 h-3.5 text-amber-600" }),
                                        "ล้างเฉพาะรูปถ่าย (เก็บสถิติ)"
                                      ]
                                    }),
                                    /*#__PURE__*/_jsxs("button", {
                                      type: "button",
                                      onClick: () => handleCleanupTerm(t.academic_year, t.semester, 'purge_all'),
                                      disabled: isCleaning,
                                      className: "px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors flex items-center gap-1",
                                      title: "ลบประวัติทั้งเทอมอย่างถาวร",
                                      children: [
                                        /*#__PURE__*/_jsx(Icon.Close, { className: "w-3.5 h-3.5 text-rose-600" }),
                                        "ลบทั้งเทอม"
                                      ]
                                    })
                                  ]
                                })
                              })
                            ]
                          })
                        ]
                      }, t.semester + '/' + t.academic_year);
                    })
                  ]
                })
              ]
            }),

            adminTab === 'line' && /*#__PURE__*/_jsx(AdminLineSettingsTab, {
              lineSettings: lineSettings,
              onSaveLineSettings: onSaveLineSettings,
              masterStudents: masterStudents,
              academicYear: adminYear,
              semester: adminSem,
              sessions: sessions
            }),

            adminTab === 'recheck' && /*#__PURE__*/_jsx(AdminRecheckTab, {
              academicYear: adminYear,
              semester: adminSem,
              activities: activities,
              openCentralActivityIds: openCentralActivityIds,
              onUpdateOpenCentralActivities: onUpdateOpenCentralActivities,
              onRefreshParent: reloadData || onUpdateStudents
            }),

            adminTab === 'clubs' && /*#__PURE__*/_jsx(AdminClubTab, {
              academicYear: adminYear,
              semester: adminSem,
              onRefreshParent: reloadData || onUpdateStudents
            })
          ]
        })
      ]
    })
  ]
})
});
}

  // Export to Global
  window.AdminPanelModal = AdminPanelModal;
  console.log('✅ Admin Module Loaded Successfully');
})(window);

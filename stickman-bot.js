// =========================================================================
// 🤖 COMPONENT: ผู้ช่วยบอทอัจฉริยะ (Smart College Mascot Bot)
// ออกแบบสไตล์ Modern 3D/Flat Mascot Avatar คุณภาพสูง (เวกเตอร์คมชัด 100%)
// มี 3 คอสตูมตามบทบาท: นักเรียน/ทั่วไป, ครูที่ปรึกษา, ผู้ดูแลระบบ
// =========================================================================

function MascotAvatarSVG({ role = 'student', isSpeaking = false, className = "w-12 h-12" }) {
  // สัดส่วนเวกเตอร์ล็อกเป๊ะ 120x120 คมชัด 100% ไม่เบี้ยว
  return /*#__PURE__*/_jsxs("svg", {
    viewBox: "0 0 120 120",
    className: `${className} select-none transition-transform duration-200`,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    children: [
      /* Outer Glow / Circular Frame */
      /*#__PURE__*/_jsx("circle", {
        cx: "60",
        cy: "60",
        r: "54",
        className: role === 'admin'
          ? "fill-slate-900 stroke-amber-400 stroke-[3]"
          : (role === 'teacher' ? "fill-teal-950 stroke-emerald-400 stroke-[3]" : "fill-sky-950 stroke-sky-400 stroke-[3]")
      }),

      /* Mascot Body (Cute Rounded Modern Robot/Character) */
      /* Body Base */
      /*#__PURE__*/_jsx("ellipse", {
        cx: "60",
        cy: "88",
        rx: "32",
        ry: "24",
        className: role === 'admin'
          ? "fill-slate-800 stroke-slate-700 stroke-2"
          : (role === 'teacher' ? "fill-teal-800 stroke-teal-700 stroke-2" : "fill-sky-800 stroke-sky-700 stroke-2")
      }),

      /* Head / Face Dome */
      /*#__PURE__*/_jsx("rect", {
        x: "28",
        y: "28",
        width: "64",
        height: "50",
        rx: "24",
        fill: "#FFFFFF",
        stroke: role === 'admin' ? "#f59e0b" : (role === 'teacher' ? "#10b981" : "#38bdf8"),
        strokeWidth: "3"
      }),

      /* Visor / Face Screen */
      /*#__PURE__*/_jsx("rect", {
        x: "36",
        y: "36",
        width: "48",
        height: "34",
        rx: "16",
        fill: "#0f172a"
      }),

      /* Friendly Eyes (Expressive) */
      /* Left Eye */
      /*#__PURE__*/_jsx("ellipse", {
        cx: "48",
        cy: isSpeaking ? "51" : "53",
        rx: "4.5",
        ry: isSpeaking ? "6.5" : "5",
        className: role === 'admin' ? "fill-amber-400" : (role === 'teacher' ? "fill-emerald-400" : "fill-cyan-400")
      }),
      /* Right Eye */
      /*#__PURE__*/_jsx("ellipse", {
        cx: "72",
        cy: isSpeaking ? "51" : "53",
        rx: "4.5",
        ry: isSpeaking ? "6.5" : "5",
        className: role === 'admin' ? "fill-amber-400" : (role === 'teacher' ? "fill-emerald-400" : "fill-cyan-400")
      }),

      /* Eye Highlights */
      /*#__PURE__*/_jsx("circle", { cx: "50", cy: "50", r: "1.5", fill: "#FFFFFF" }),
      /*#__PURE__*/_jsx("circle", { cx: "74", cy: "50", r: "1.5", fill: "#FFFFFF" }),

      /* Smile / Talking Mouth */
      isSpeaking ? /*#__PURE__*/_jsx("ellipse", {
        cx: "60",
        cy: "62",
        rx: "5",
        ry: "3",
        fill: "#f43f5e"
      }) : /*#__PURE__*/_jsx("path", {
        d: "M 54 61 Q 60 65 66 61",
        stroke: role === 'admin' ? "#fbbf24" : "#38bdf8",
        strokeWidth: "2",
        strokeLinecap: "round",
        fill: "none"
      }),

      /* Antenna / Signal Light */
      /*#__PURE__*/_jsx("line", { x1: "60", y1: "28", x2: "60", y2: "17", stroke: "#94a3b8", strokeWidth: "3", strokeLinecap: "round" }),
      /*#__PURE__*/_jsx("circle", {
        cx: "60",
        cy: "15",
        r: "5",
        className: isSpeaking ? "fill-rose-500 animate-ping" : (role === 'admin' ? "fill-amber-400" : "fill-emerald-400")
      }),

      // ==========================================
      // COSTUME ACCORDING TO ROLE
      // ==========================================

      // 🎒 1. STUDENT MODE: Graduation / Student Cap + Star
      role === 'student' && /*#__PURE__*/_jsxs("g", {
        children: [
          /* Cap Diamond */
          /*#__PURE__*/_jsx("polygon", {
            points: "60,8 86,18 60,26 34,18",
            fill: "#0284c7",
            stroke: "#38bdf8",
            strokeWidth: "2"
          }),
          /* Cap Skull */
          /*#__PURE__*/_jsx("rect", { x: "48", y: "18", width: "24", height: "8", rx: "3", fill: "#0369a1" }),
          /* Gold Tassel */
          /*#__PURE__*/_jsx("line", { x1: "78", y1: "20", x2: "84", y2: "32", stroke: "#fbbf24", strokeWidth: "2.5", strokeLinecap: "round" }),
          /* Cute Student Ribbon on chest */
          /*#__PURE__*/_jsx("polygon", { points: "55,84 65,84 60,92", fill: "#38bdf8" })
        ]
      }),

      // 📋 2. TEACHER MODE: Stylish Smart Glasses + Tie
      role === 'teacher' && /*#__PURE__*/_jsxs("g", {
        children: [
          /* Left Rim */
          /*#__PURE__*/_jsx("rect", { x: "40", y: "45", width: "16", height: "14", rx: "3", stroke: "#10b981", strokeWidth: "2", fill: "rgba(16,185,129,0.15)" }),
          /* Right Rim */
          /*#__PURE__*/_jsx("rect", { x: "64", y: "45", width: "16", height: "14", rx: "3", stroke: "#10b981", strokeWidth: "2", fill: "rgba(16,185,129,0.15)" }),
          /* Bridge */
          /*#__PURE__*/_jsx("line", { x1: "56", y1: "52", x2: "64", y2: "52", stroke: "#10b981", strokeWidth: "2" }),
          /* Teacher Collar */
          /*#__PURE__*/_jsx("polygon", { points: "50,78 60,86 70,78 60,76", fill: "#FFFFFF" }),
          /* Green Tie */
          /*#__PURE__*/_jsx("polygon", { points: "58,85 62,85 61,98 59,98", fill: "#059669" })
        ]
      }),

      // 😎 3. ADMIN MODE: Gold Aviator Sunglasses + Commander Suit
      role === 'admin' && /*#__PURE__*/_jsxs("g", {
        children: [
          /* Cool Golden Sunglasses Left */
          /*#__PURE__*/_jsx("polygon", { points: "38,44 56,44 54,58 42,58", fill: "#f59e0b", stroke: "#d97706", strokeWidth: "1.5" }),
          /* Cool Golden Sunglasses Right */
          /*#__PURE__*/_jsx("polygon", { points: "64,44 82,44 78,58 66,58", fill: "#f59e0b", stroke: "#d97706", strokeWidth: "1.5" }),
          /* Glasses Bridge */
          /*#__PURE__*/_jsx("line", { x1: "56", y1: "48", x2: "64", y2: "48", stroke: "#f59e0b", strokeWidth: "2" }),
          /* Commander Gold Lapels */
          /*#__PURE__*/_jsx("polygon", { points: "45,78 60,86 52,98", fill: "#d97706" }),
          /*#__PURE__*/_jsx("polygon", { points: "75,78 60,86 68,98", fill: "#d97706" }),
          /* Gold Tie */
          /*#__PURE__*/_jsx("polygon", { points: "58,86 62,86 61,98 59,98", fill: "#fbbf24" })
        ]
      })
    ]
  });
}

function StickmanAssistantModal({ isOpen, onClose, currentRole = 'student', isAdminLoggedIn = false, onSelectRole }) {
  const [activeTab, setActiveTab] = useState(currentRole);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('stickman_bot_muted') === 'true');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    setActiveTab(currentRole);
  }, [currentRole]);

  const getGreeting = (role) => {
    if (role === 'admin') {
      return {
        sender: 'bot',
        text: 'สวัสดีค่ะท่านผู้ดูแลระบบ! หนู "น้องผู้ช่วยแอดมิน" ยินดีให้คำแนะนำการจัดการระบบหลังบ้าน เปิดปิดกิจกรรมกลาง กิจกรรมชมรม และการจัดการสิทธิ์ครูนักเรียนค่ะ'
      };
    } else if (role === 'teacher') {
      return {
        sender: 'bot',
        text: 'สวัสดีค่ะคุณครูที่ปรึกษา! หนู "น้องผู้ช่วยครู" ยินดีให้คำแนะนำการเช็คชื่อเข้าแถว (แก้ไขได้ก่อน 08:20 น.), กิจกรรมกลาง, กิจกรรมชมรม และการเพิ่มนักเรียนในห้องค่ะ'
      };
    } else {
      return {
        sender: 'bot',
        text: 'สวัสดีค่ะน้องๆ นักศึกษา และท่านผู้ปกครอง! หนู "น้องผู้ช่วยกิจกรรมวิทยาลัย" ยินดีตอบข้อสงสัยเรื่องเกณฑ์กิจกรรม 80%, ขั้นตอนการยื่นเกียรติบัตรแก้ มผ. และระเบียบวิทยาลัยค่ะ'
      };
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMessages([getGreeting(activeTab)]);
    } else {
      stopAllSpeech();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speechRequestIdRef = useRef(0);
  const currentAudioRef = useRef(null);

  // หยุดเสียงพูดทุกระบบทันที (ป้องกันเสียงซ้อน 100%)
  const stopAllSpeech = () => {
    // เพิ่ม request ID เพื่อตัดการทำงานของ callback หรือ speech เดิมทั้งหมดทันที
    speechRequestIdRef.current += 1;

    // 1. ยกเลิก ResponsiveVoice ทันที
    if (window.responsiveVoice && typeof window.responsiveVoice.cancel === 'function') {
      try { window.responsiveVoice.cancel(); } catch(_) {}
    }

    // 2. หยุดและเคลียร์ HTML5 Audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
      } catch(_) {}
      currentAudioRef.current = null;
    }

    // 3. ยกเลิก Web SpeechSynthesis ในเบราว์เซอร์
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch(_) {}
    }

    setIsSpeaking(false);
  };

  // ทำความสะอาดข้อความให้อ่านอย่างเป็นธรรมชาติ อ่านครบถ้วนทุกประโยค ไม่มีการตัดทอน
  const cleanSpeechText = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}📌💡⚠️📸🔒🟢⏱✓✕•\-]/gu, ' ')
      .replace(/[/\\*#_~<>\[\]{}()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // ระบบสังเคราะห์เสียงภาษาไทยคุณภาพสูง (Universal Thai TTS Engine)
  // - ป้องกันเสียงซ้อนด้วย monotonic request ID lock
  // - อ่านจบครบทุกตัวอักษร ไม่ตัดทอน (No truncation)
  // - สำเนียงผู้หญิงไทยธรรมชาติ ไม่บีบเสียงเป็นหุ่นยนต์ (pitch 1.0, rate 1.15 กระชับคล่องแคล่ว)
  const speakText = (text) => {
    if (isMuted) return;
    stopAllSpeech();

    const clean = cleanSpeechText(text);
    if (!clean) return;

    const currentRequestId = speechRequestIdRef.current;
    setIsSpeaking(true);

    // ลำดับที่ 1: ResponsiveVoice Thai Female (เสียงผู้หญิงไทยแท้ คมชัด นุ่มนวล รองรับทุกอุปกรณ์)
    if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
      try {
        window.responsiveVoice.speak(clean, "Thai Female", {
          pitch: 1.0,  // คีย์เสียงธรรมชาติแท้ ไม่บิดเบือน
          rate: 1.15,  // สปีดกระชับทันใจ คล่องแคล่ว ไม่ยืดเยื้อ
          volume: 1.0,
          onstart: () => {
            if (currentRequestId === speechRequestIdRef.current) {
              setIsSpeaking(true);
            }
          },
          onend: () => {
            if (currentRequestId === speechRequestIdRef.current) {
              setIsSpeaking(false);
            }
          },
          onerror: () => {
            if (currentRequestId === speechRequestIdRef.current) {
              fallbackNativeSpeech(clean, currentRequestId);
            }
          }
        });
        return;
      } catch (rvErr) {
        console.warn('ResponsiveVoice failed:', rvErr);
      }
    }

    // ลำดับที่ 2: ระบบเสียงของระบบปฏิบัติการ (Web Speech API)
    fallbackNativeSpeech(clean, currentRequestId);
  };

  const fallbackNativeSpeech = (clean, reqId) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'th-TH';
      utterance.rate = 1.15; // ความเร็วกระชับ เป็นธรรมชาติ
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices() || [];
      const thaiVoice = voices.find(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return (lang === 'th-th' || lang.startsWith('th')) && 
               (name.includes('premwadee') || name.includes('kanya') || name.includes('narisa') || name.includes('female'));
      }) || voices.find(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang.startsWith('th') || name.includes('thai') || name.includes('ไทย');
      });

      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      utterance.onstart = () => {
        if (reqId === speechRequestIdRef.current) setIsSpeaking(true);
      };
      utterance.onend = () => {
        if (reqId === speechRequestIdRef.current) setIsSpeaking(false);
      };
      utterance.onerror = () => {
        if (reqId === speechRequestIdRef.current) setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (_) {
      if (reqId === speechRequestIdRef.current) setIsSpeaking(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('stickman_bot_muted', String(nextMuted));
    if (nextMuted) { stopAllSpeech(); }
  };

  const FAQ_DATABASE = {
    student: [
      {
        q: "เกณฑ์การผ่านกิจกรรม 80% มีอะไรบ้าง?",
        a: "เกณฑ์การผ่านกิจกรรมของวิทยาลัยต้องได้ไม่น้อยกว่า 80% ทุกด้านค่ะ:\n1. กิจกรรมเข้าแถวหน้าเสาธง คิดจากจำนวนวันเข้าแถวจริง\n2. กิจกรรมกลางของวิทยาลัย ตามจำนวนที่องค์การฯ จัดขึ้น\n3. กิจกรรมชมรม ปวช.1 คือลูกเสือ ส่วน ปวช.2 ถึง ปวส.2 คือชมรมวิชาชีพตามสาขา"
      },
      {
        q: "ถ้าเสี่ยงติด หรือติด มผ. เข้าแถว แก้ไขอย่างไร?",
        a: "นักเรียนที่เสี่ยงติดหรือติด มผ. เข้าแถว สามารถนำเกียรติบัตรตัวจริงที่ได้รับจากการเข้าร่วมกิจกรรมหรือแข่งขัน มายื่นต่องานกิจกรรมได้ภายในระยะเวลาที่กำหนด โดยจะแบ่งเกณฑ์การชดเชยเวลาเป็นขั้นบันไดตามระดับของเกียรติบัตร หากพ้นกำหนดเวลาจะต้องปฏิบัติตามขั้นตอนประกาศของวิทยาลัยค่ะ"
      },
      {
        q: "ลาป่วยหรือลากิจ ถือว่าขาดเข้าแถวหรือไม่?",
        a: "การลาที่มีใบลาถูกต้อง ระบบจะไม่คิดเป็นการขาดโดยตรง แต่เนื่องจากเกณฑ์ 80% คำนวณจากจำนวนวันที่มาเข้าแถวจริง หากมียอดมาเข้าแถวต่ำกว่าเกณฑ์ 80% นักเรียนก็ยังคงต้องยื่นคำร้องหรือชดเชยเวลาตามระเบียบค่ะ"
      },
      {
        q: "ทำไมแถบสถานะของฉันถึงเป็นสีส้มหรือสีแดง?",
        a: "แถบสีส้มหรือสีแดงเตือนว่า ยอดการเข้าร่วมกิจกรรมของน้องต่ำกว่า 80% มีความเสี่ยงที่จะติด มผ. ในภาคเรียนนี้ ให้รีบตรวจสอบวันที่ขาด และปรึกษาครูที่ปรึกษาประจำห้องทันทีค่ะ"
      },
      {
        q: "สำหรับครู: ลืมรหัส PIN เข้าสู่ระบบไม่ได้ทำอย่างไร?",
        a: "หากคุณครูยังไม่เคยตั้งรหัสผ่าน หรือลืมรหัส PIN กรุณาติดต่อหัวหน้างานกิจกรรมวิทยาลัย เพื่อทำการรีเซ็ตรหัสผ่านเริ่มต้นให้นะคะ"
      }
    ],
    teacher: [
      {
        q: "เช็คชื่อเข้าแถวผิด ถ่ายรูปใหม่ แก้ไขได้ถึงกี่โมง?",
        a: "คุณครูสามารถแก้ไขสถานะนักเรียน หรือถ่ายรูปหลักฐานการเข้าแถวใหม่ได้ก่อนเวลา 08:20 น. ของวันนั้นค่ะ หากเกินเวลา 08:20 น. ระบบจะปิดรับการบันทึกประจำวันอัตโนมัติ"
      },
      {
        q: "สถานะ ลา หน้าเช็คชื่อหายไปไหน?",
        a: "ระบบปรับปรุงให้เหลือเพียงสถานะ มา และ ขาด ตามระเบียบการเช็คชื่อหน้าแถวจริงของวิทยาลัยค่ะ หากนักเรียนมีใบลาในภายหลัง ให้เก็บเป็นหลักฐานประกอบการพิจารณาตามเกณฑ์วิทยาลัยค่ะ"
      },
      {
        q: "ถ้าครูติดราชการ ให้ครูท่านอื่นเช็คชื่อแทนได้ไหม?",
        a: "ทำได้ค่ะ คุณครูสามารถแจ้งรหัส PIN ของห้องให้ครูที่ปรึกษาร่วม หรือครูผู้สอนแทนที่ได้รับมอบหมายเข้ามาดำเนินการเช็คชื่อและแนบรูปภาพแทนได้ตามความไว้วางใจค่ะ"
      },
      {
        q: "ครูสามารถเพิ่มนักเรียนเข้าห้องด้วยตนเองได้ไหม?",
        a: "ทำได้ค่ะ ในหน้าจัดการห้องเรียน คุณครูสามารถกดปุ่มเพิ่มนักเรียนใหม่ กรอกรหัสประจำตัวและชื่อ เพื่อเพิ่มนักเรียนเข้าห้องของตนเองได้ทันทีโดยไม่ต้องรอแอดมินค่ะ"
      },
      {
        q: "กิจกรรมกลางและกิจกรรมชมรมเช็คชื่อได้ถึงเมื่อไหร่?",
        a: "สามารถเช็คชื่อและแก้ไขได้ตลอดเวลา ตราบใดที่แอดมินยังเปิดสิทธิ์รอบนั้นๆ อยู่ หากแอดมินปิดรับการเช็คชื่อแล้วจะไม่สามารถแก้ไขได้ค่ะ"
      },
      {
        q: "วิธีเปลี่ยนรหัสผ่าน PIN ประจำตัวของครู?",
        a: "เมื่อเข้าสู่หน้าเช็คชื่อห้องของท่าน ให้กดปุ่ม เปลี่ยน PIN ด้านบน กรอกรหัสเดิมและตั้งรหัสใหม่ 6 หลักได้ทันทีค่ะ"
      }
    ],
    admin: [
      {
        q: "เปิดปิดให้ครูเช็คชื่อกิจกรรมกลางและกิจกรรมชมรมอย่างไร?",
        a: "ไปที่แท็บ กิจกรรมกลาง หรือ กิจกรรมชมรม กดปุ่มสวิตช์ เปิดให้เช็คชื่อ หรือ ปิดล็อกอยู่ หลังกิจกรรมครั้งนั้นๆ ได้เลยค่ะ สถานะจะซิงค์ไปยังหน้าเช็คชื่อของครูทุกคนแบบเรียลไทม์ทันทีค่ะ"
      },
      {
        q: "เพิ่มกิจกรรมกลางใหม่ กำหนดวันที่และรายละเอียดตรงไหน?",
        a: "ในแท็บ กิจกรรมกลาง กดปุ่ม เพิ่มกิจกรรมใหม่ ระบบจะมีช่องให้ระบุ ชื่อกิจกรรม วันที่จัดกิจกรรม รายละเอียดวัตถุประสงค์ และลิงก์ Google Drive คลังภาพ ครบถ้วนค่ะ"
      },
      {
        q: "จัดการเพิ่มครั้งที่จัดกิจกรรมชมรมทำอย่างไร?",
        a: "ไปที่แท็บ กิจกรรมชมรม กดปุ่ม เพิ่มครั้งที่จัดชมรม กำหนดครั้งที่ วันที่จัดกิจกรรม และรายละเอียด แล้วเปิดสวิตช์ให้ครูเช็คชื่อได้ทันทีค่ะ"
      },
      {
        q: "กรณีครูลืมรหัส PIN แอดมินต้องรีเซ็ตให้ตรงไหน?",
        a: "ไปที่แท็บ จัดการครู ค้นหาชื่อครูท่านนั้น แล้วกดปุ่ม รีเซ็ตรหัส PIN ระบบจะทำการคืนค่ารหัสผ่านเป็นค่าเริ่มต้นของวิทยาลัยทันทีค่ะ"
      },
      {
        q: "ปุ่มส่งออกไฟล์ Excel อยู่ตรงไหน?",
        a: "ปุ่มส่งออก Excel อยู่ในหน้าแอดมิน ที่แท็บ รายชื่อนักเรียน ด้านขวาบนของตารางรายชื่อค่ะ"
      }
    ]
  };

  const handleAskQuestion = (questionText, answerText) => {
    const userMsg = { sender: 'user', text: questionText };
    const botMsg = { sender: 'bot', text: answerText };
    setMessages(prev => [...prev, userMsg, botMsg]);
    speakText(answerText);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const query = inputQuestion.trim();
    if (!query) return;

    const userMsg = { sender: 'user', text: query };
    setInputQuestion('');

    const currentFaqs = FAQ_DATABASE[activeTab] || [];
    const lower = query.toLowerCase();
    const match = currentFaqs.find(item => 
      item.q.toLowerCase().includes(lower) || 
      lower.includes(item.q.toLowerCase().substring(0, 6)) ||
      item.a.toLowerCase().includes(lower)
    );

    let answer = "";
    if (match) {
      answer = match.a;
    } else {
      if (activeTab === 'student') {
        answer = `คำถามเรื่อง ${query} ขอแนะนำให้น้องๆ ติดต่อครูที่ปรึกษาประจำห้อง หรือสอบถามโดยตรงที่ห้องงานกิจกรรมพัฒนานักเรียนนักศึกษา เพื่อรับข้อมูลที่ถูกต้องตามประกาศล่าสุดค่ะ`;
      } else if (activeTab === 'teacher') {
        answer = `สำหรับข้อสงสัยเรื่อง ${query} คุณครูสามารถติดต่อหัวหน้างานกิจกรรมวิทยาลัย หรือผู้ดูแลระบบ เพื่อประสานงานโดยตรงได้เลยค่ะ`;
      } else {
        answer = `สำหรับข้อสงสัยแอดมินเรื่อง ${query} สามารถตรวจสอบการตั้งค่าเพิ่มเติมได้ที่แท็บ ตั้งค่าระบบ หรือตรวจสอบสิทธิ์ของฐานข้อมูลค่ะ`;
      }
    }

    const botMsg = { sender: 'bot', text: answer };
    setMessages(prev => [...prev, userMsg, botMsg]);
    speakText(answer);
  };

  if (!isOpen) return null;

  const roleNames = {
    student: 'นักเรียน & ทั่วไป',
    teacher: 'ครูที่ปรึกษา',
    admin: 'ผู้ดูแลระบบ (Admin)'
  };

  return /*#__PURE__*/_jsx("div", {
    className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4",
    onClick: onClose,
    children: /*#__PURE__*/_jsxs("div", {
      className: "bg-white w-full max-w-lg h-[88vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200",
      onClick: e => e.stopPropagation(),
      children: [
        /* Top Navigation Header */
        /*#__PURE__*/_jsxs("div", {
          className: `p-3.5 sm:p-4 text-white flex items-center justify-between border-b ${
            activeTab === 'admin'
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-indigo-800'
              : (activeTab === 'teacher'
                ? 'bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border-teal-800'
                : 'bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 border-sky-800')
          }`,
          children: [
            /* Avatar + Name */
            /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-3",
              children: [
                /*#__PURE__*/_jsx("div", {
                  className: "relative cursor-pointer hover:scale-105 transition-transform",
                  onClick: () => {
                    if (isSpeaking) {
                      stopAllSpeech();
                    } else {
                      speakText(messages[messages.length - 1]?.text || "ยินดีให้คำแนะนำค่ะ");
                    }
                  },
                  title: isSpeaking ? "คลิกเพื่อหยุดเสียงพูด" : "คลิกเพื่อให้บอทอ่านออกเสียง",
                  children: /*#__PURE__*/_jsx(MascotAvatarSVG, {
                    role: activeTab,
                    isSpeaking: isSpeaking,
                    className: "w-11 h-11"
                  })
                }),
                /*#__PURE__*/_jsxs("div", {
                  children: [
                    /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center gap-1.5",
                      children: [
                        /*#__PURE__*/_jsx("h4", {
                          className: "text-sm sm:text-base font-black tracking-tight text-white",
                          children: activeTab === 'admin' ? "ผู้ช่วยแอดมิน (Admin)" : (activeTab === 'teacher' ? "ผู้ช่วยครูที่ปรึกษา" : "ผู้ช่วยกิจกรรมวิทยาลัย")
                        }),
                        isSpeaking && /*#__PURE__*/_jsxs("button", {
                          type: "button",
                          onClick: (e) => { e.stopPropagation(); stopAllSpeech(); },
                          title: "คลิกเพื่อหยุดเสียงพูดทันที",
                          className: "text-[10px] bg-rose-500 hover:bg-rose-600 cursor-pointer text-white px-1.5 py-0.5 rounded font-black animate-pulse flex items-center gap-0.5 shadow-xs transition-colors",
                          children: ["🔊", "กำลังพูด (คลิกหยุด)"]
                        })
                      ]
                    }),
                    /*#__PURE__*/_jsxs("p", {
                      className: "text-[11px] text-slate-300 font-medium",
                      children: ["โหมดคำถาม: ", roleNames[activeTab]]
                    })
                  ]
                })
              ]
            }),

            /* Right Header Controls: Audio Mute & Close */
            /*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-1.5",
              children: [
                /* Voice Mute Toggle */
                /*#__PURE__*/_jsx("button", {
                  type: "button",
                  onClick: toggleMute,
                  title: isMuted ? "เปิดเสียงอ่านภาษาไทย" : "ปิดเสียงอ่าน (Mute)",
                  className: `p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  }`,
                  children: isMuted ? "🔇 ปิดเสียง" : "🔊 เปิดเสียง"
                }),
                /* Close Button */
                /*#__PURE__*/_jsx("button", {
                  type: "button",
                  onClick: onClose,
                  className: "p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer",
                  children: /*#__PURE__*/_jsx(Icon.Close, { className: "w-4 h-4" })
                })
              ]
            })
          ]
        }),

        /* Role Switcher Pills (แสดงเฉพาะเมื่อเข้าสู่ระบบด้วยสิทธิ์ Admin เท่านั้น เพื่อให้แอดมินสลับดูได้ทั้ง 3 ฝั่ง) */
        isAdminLoggedIn && /*#__PURE__*/_jsx("div", {
          className: "p-2 bg-slate-100 border-b border-slate-200 flex gap-1.5 text-xs font-bold",
          children: [
            { id: 'student', label: '🎒 นักเรียน / ทั่วไป' },
            { id: 'teacher', label: '📋 ครูที่ปรึกษา' },
            { id: 'admin', label: '😎 ผู้ดูแลระบบ (Admin)' }
          ].map(r => /*#__PURE__*/_jsx("button", {
            key: r.id,
            type: "button",
            onClick: () => {
              setActiveTab(r.id);
              if (onSelectRole) onSelectRole(r.id);
            },
            className: `flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center truncate ${
              activeTab === r.id
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`,
            children: r.label
          }, r.id))
        }),

        /* Chat History Area */
        /*#__PURE__*/_jsxs("div", {
          className: "flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/70 custom-scroll text-xs sm:text-sm",
          children: [
            messages.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return /*#__PURE__*/_jsxs("div", {
                className: `flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`,
                children: [
                  isBot && /*#__PURE__*/_jsx("div", {
                    className: "flex-shrink-0 cursor-pointer mt-0.5",
                    onClick: () => speakText(m.text),
                    title: "กดเพื่อฟังเสียงอ่าน",
                    children: /*#__PURE__*/_jsx(MascotAvatarSVG, {
                      role: activeTab,
                      isSpeaking: false,
                      className: "w-8 h-8"
                    })
                  }),
                  /*#__PURE__*/_jsxs("div", {
                    className: `max-w-[82%] sm:max-w-[75%] p-3 rounded-2xl shadow-2xs space-y-1.5 ${
                      isBot
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        : 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                    }`,
                    children: [
                      /*#__PURE__*/_jsx("p", {
                        className: "whitespace-pre-line leading-relaxed",
                        children: m.text
                      }),
                      isBot && /*#__PURE__*/_jsxs("div", {
                        className: "flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-sans",
                        children: [
                          /*#__PURE__*/_jsx("span", { children: "บอทผู้ช่วยกิจกรรม" }),
                          /*#__PURE__*/_jsxs("button", {
                            type: "button",
                            onClick: () => {
                              if (isSpeaking) {
                                stopAllSpeech();
                              } else {
                                speakText(m.text);
                              }
                            },
                            className: "text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer",
                            children: [/*#__PURE__*/_jsx("span", { children: isSpeaking ? "⏹️" : "🔊" }), isSpeaking ? "หยุดอ่าน" : "อ่านให้ฟัง"]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }, idx);
            }),

            /* Quick Question Chips Container */
            /*#__PURE__*/_jsxs("div", {
              className: "pt-2 space-y-1.5",
              children: [
                /*#__PURE__*/_jsxs("div", {
                  className: "text-[11px] font-bold text-slate-500 flex items-center gap-1",
                  children: [/*#__PURE__*/_jsx("span", { children: "✨" }), "คำถามที่พบบ่อย (แตะเพื่อดูคำตอบ):"]
                }),
                /*#__PURE__*/_jsx("div", {
                  className: "flex flex-wrap gap-1.5",
                  children: (FAQ_DATABASE[activeTab] || []).map((faq, fIdx) => /*#__PURE__*/_jsxs("button", {
                    key: fIdx,
                    type: "button",
                    onClick: () => handleAskQuestion(faq.q, faq.a),
                    className: "px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold text-left transition-all active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer",
                    children: [
                      /*#__PURE__*/_jsx("span", { className: "text-amber-500 font-bold", children: "•" }),
                      faq.q
                    ]
                  }, fIdx))
                })
              ]
            }),
            /*#__PURE__*/_jsx("div", { ref: chatBottomRef })
          ]
        }),

        /* Bottom Input Form */
        /*#__PURE__*/_jsx("form", {
          onSubmit: handleCustomSubmit,
          className: "p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2",
          children: /*#__PURE__*/_jsxs("div", {
            className: "flex-1 relative flex items-center",
            children: [
              /*#__PURE__*/_jsx("input", {
                type: "text",
                value: inputQuestion,
                onChange: e => setInputQuestion(e.target.value),
                placeholder: `พิมพ์คำถามสำหรับ ${roleNames[activeTab]}...`,
                className: "w-full bg-slate-50 border border-slate-300 rounded-2xl pl-3.5 pr-20 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
              }),
              /*#__PURE__*/_jsx("button", {
                type: "submit",
                disabled: !inputQuestion.trim(),
                className: "absolute right-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs",
                children: "ถาม"
              })
            ]
          })
        })
      ]
    })
  });
}

// Floating Bubble Button (Pinned to Bottom-Right Screen)
function StickmanFloatingBubble({ currentRole = 'student', onClick }) {
  return /*#__PURE__*/_jsxs("div", {
    className: "fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none group",
    children: [
      /* Tooltip Tag */
      /*#__PURE__*/_jsxs("div", {
        onClick: onClick,
        className: "hidden sm:flex items-center gap-1.5 bg-slate-900/90 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg backdrop-blur-xs cursor-pointer border border-white/20 transition-all transform group-hover:scale-105",
        children: [
          /*#__PURE__*/_jsx("span", {
            className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping"
          }),
          currentRole === 'admin' ? "ผู้ช่วยแอดมิน" : (currentRole === 'teacher' ? "ผู้ช่วยครู" : "สอบถามเกณฑ์ 80%")
        ]
      }),

      /* Bubble Button with Vector Mascot */
      /*#__PURE__*/_jsxs("button", {
        type: "button",
        onClick: onClick,
        title: "สอบถามผู้ช่วยกิจกรรม (เกณฑ์กิจกรรม / ขั้นตอน)",
        className: "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-slate-900 via-sky-950 to-indigo-900 hover:from-slate-800 hover:to-indigo-800 p-0.5 shadow-2xl border-2 border-white/80 cursor-pointer transition-transform active:scale-95 flex items-center justify-center hover:ring-4 hover:ring-sky-300/40",
        children: [
          /* SVG Mascot */
          /*#__PURE__*/_jsx(MascotAvatarSVG, {
            role: currentRole,
            isSpeaking: false,
            className: "w-full h-full p-1"
          }),
          /* Online Badge */
          /*#__PURE__*/_jsx("span", {
            className: "absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300"
          })
        ]
      })
    ]
  });
}

window.MascotAvatarSVG = MascotAvatarSVG;
window.StickmanAvatarSVG = MascotAvatarSVG; // Backwards compatibility
window.StickmanAssistantModal = StickmanAssistantModal;
window.StickmanFloatingBubble = StickmanFloatingBubble;

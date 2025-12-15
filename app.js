const express = require('express');
const path = require('path');
const { QuickDB } = require('quick.db');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
const db = new QuickDB();


const session = require('express-session');







require('dotenv').config();
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const express2 = require('express');
const serveIndex = require('serve-index');
const { register } = require('module');
const { error } = require('console');

const fileServer = express2();

const targetPath = path.join(__dirname);

fileServer.use('/', express2.static(targetPath), serveIndex(targetPath, { icons: true }));

fileServer.listen(5000, () => {
  console.log('File explorer ready http://localhost:5000');
});








function verifyOrigin(req, res, next) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    next();
  } else {
    res.status(403).json({ error: '🚫 طلب غير مصرح به' });
  }
}
















app.use(session({
  secret: 'dhjkasjkdhjkhasdhjksahkljDHAdjk;lahD:lhjkawdHjkajkwgdhjafgdvhDJKGHDWHJdgahjwgd',
  resave: true, // تغيير من false إلى true
  saveUninitialized: false, // تغيير من true إلى false
  cookie: { 
    secure: false, // في الإنتاج استخدم true مع HTTPS
    maxAge: 24 * 60 * 60 * 1000 // انتهاء الصلاحية بعد 24 ساعة
  }
}));

app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  
  if (req.session.user?.role === 'patient') {
    const patients = await db.get('patients') || [];
    res.locals.currentPatient = patients.find(p => p.id === req.session.user.patientId) || null;
  } else if (req.session.user?.role === 'admin') {
    res.locals.currentPatient = null;
  }
  
  next();
});

const requireSuperAdmin = (req, res, next) => {
  if (req.session.user?.role === 'admin' && req.session.user?.username === 'admin') {
    return next();
  }
  res.status(403).render('error', { 
    message: 'غير مصرح بالوصول. هذه الصفحة للمسؤول الرئيسي فقط' 
  });
};
const requireAdmin = (req, res, next) => {
  if (req.session.user?.role === 'admin') {
    return next();
  }

  console.warn(`محاولة وصول غير مصرح بها إلى ${req.path} من قبل المستخدم: ${req.session.user?.username || 'غير مسجل'}`);
  res.status(403).render('error', { 
    message: 'غير مصرح بالوصول. هذه الصفحة للمسؤولين فقط.' 
  });
};

const requireDoctorAndLab = (req, res, next) => {
  if (req.session.user?.role === 'doctor' || req.session.user?.role === 'admin' || req.session.user?.role === 'lab') {
    return next();
  }
  res.status(403).render('error', {
    message: 'غير مصرح بالوصول. هذه الصفحة للأطباء فقط'
  });
};
const requireDoctor = (req, res, next) => {
  if (req.session.user?.role === 'doctor' || req.session.user?.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    message: 'غير مصرح بالوصول. هذه الصفحة للأطباء فقط'
  });
};


const requireLab = (req, res, next) => {
  if (req.session.user?.role === 'lab') {
    return next();
  }
  res.status(403).render('error', {
    message: 'غير مصرح بالوصول. هذه الصفحة للأطباء فقط'
  });
};

const requirePatientAccess = async (req, res, next) => {
  const sessionUser = req.session.user;
  const requestedId = parseInt(req.params.id);

  // مسؤول أو طبيب → يدخل عادي
  if (sessionUser?.role === 'admin' || sessionUser?.role === 'doctor' || sessionUser?.role === 'lab') {
    return next();
  }

  // المريض نفسه فقط يقدر يدخل على صفحته
  if (sessionUser?.role === 'patient' && sessionUser.patientId === requestedId) {
    return next();
  }

  // غير مصرح له
  return res.status(403).render('error', {
    message: 'غير مصرح بالوصول إلى ملف هذا المريض'
  });
};

// تهيئة قاعدة البيانات مع بيانات أولية
async function initializeDatabase() {
  // في قسم تهيئة البيانات
if (!await db.has('doctors')) {
  await db.set('doctors', [
    {
      id: 1,
      username: "doctor1", // أضفنا هذا الحقل
      name: "د. أحمد محمد",
      specialty: "أمراض القلب",
      hospital: "مستشفى المدينة",
      email: "doctor1@example.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq5Q1B1M9f6VdD4JbJfLQY50b5GJ.K", // admin123
      image: "https://via.placeholder.com/200",
      role: "doctor"
    }
  ]);
}

  if (!await db.has('patients')) {
    await db.set('patients', [
      {
        id: 1,
        name: "محمد علي",
        email: "mohamed@example.com",
        phone: "+966 50 123 4567",
        image: "https://via.placeholder.com/150",
        appointments: [
          {
            id: 1,
            doctorId: 1,
            date: "2023-06-15",
            time: "5:00 مساءً",
            status: "confirmed"
          }
        ],
        medicalHistory: [
          {
            id: 1,
            doctorId: 2,
            date: "2023-05-10",
            diagnosis: "تنظيف أسنان وفحص دوري",
            prescriptionId: 1
          }
        ]
      }
    ]);
  }

  if (!await db.has('prescriptions')) {
    await db.set('prescriptions', [
      {
        id: 1,
        patientId: 1,
        doctorId: 2,
        date: "2023-05-10",
        diagnosis: "تنظيف أسنان وفحص دوري",
        medications: [
          {
            name: "مسكن ألم",
            dosage: "حبة واحدة",
            frequency: "عند الحاجة",
            duration: "3 أيام"
          }
        ],
        instructions: [
          "تنظيف الأسنان مرتين يومياً",
          "استخدام خيط الأسنان يومياً"
        ]
      }
    ]);
  }

  if (!await db.has('users')) {
  await db.set('users', [
    {
      id: 1,
      username: "admin",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq5Q1B1M9f6VdD4JbJfLQY50b5GJ.K", // admin123
      role: "admin",
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
  ]);
}
if (!await db.has('activityLogs')) {
  await db.set('activityLogs', []);
}
  if (!await db.has('users')) {
    await db.set('users', [
        {
            id: 2,
            username: "patient1",
            password: "patient123",
            role: "patient",
            patientId: 1
        }
    ]);
}

if (!await db.has('clinics')) {
  await db.set('clinics', [
    {
      id: 1,
      name: "عيادة الشفاء",
      location: "بغداد - المنصور",
      description: "عيادة متخصصة بأمراض القلب والأسنان",
      schedule: "1:00 ص, - 5:00 م"

    }
  ]);
}
if (!await db.has('appointments')) {
  await db.set('appointments', []);
}
if (!await db.has('messages')) {
  await db.set('messages', []);
}

if (!await db.has('labResults')) {
  await db.set('labResults', []);
}
if (!await db.has('otps')) {
  await db.set('otps', []);
}
}

// استدعاء الدالة لتهيئة قاعدة البيانات
initializeDatabase().catch(console.error);

// إعدادات التطبيق
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));



function restrictMethods(app, route, allowedMethods) {
  // route لازم يكون: String أو RegExp أو Array.of(String or RegExp)
  app.all(route, (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res
        .status(405)
        .send(`🚫 الطريقة ${req.method} غير مسموحة لهذا المسار`);
    }
    next();
  });
}
// حماية المسارات المفتوحة
// 1) مسارات عامة ثابتة
restrictMethods(app, '/', ['GET']);
restrictMethods(app, '/doctors', ['GET']);
restrictMethods(app, '/api/doctors', ['GET']);


// 2) مسارات عرض مفردات بدلالة ID
restrictMethods(app, '/doctor/:id', ['GET']);
restrictMethods(app, '/patient/:id', ['GET']);
restrictMethods(app, '/prescription/:id', ['GET']);


// 3) مسارات التوثيق والتسجيل
restrictMethods(app, '/login', ['GET','POST']);
restrictMethods(app, '/register', ['GET','POST']);
restrictMethods(app, '/register-phone', ['GET','POST']);
restrictMethods(app, '/verify-otp', ['GET','POST']);
restrictMethods(app, '/register-details', ['GET','POST']);
restrictMethods(app, '/reset-admin-password', ['GET']);


// 4) صفحة المساعدة (help)
restrictMethods(app, '/help', ['GET','POST']);


// 5) لوحة التحكم – عرض فقط
restrictMethods(app, '/dashboard', ['GET']);
restrictMethods(app, '/dashboard/patients', ['GET']);
restrictMethods(app, '/dashboard/doctors', ['GET']);
restrictMethods(app, '/dashboard/messages', ['GET']);
restrictMethods(app, '/dashboard/admins', ['GET']);
restrictMethods(app, '/dashboard/activity-logs', ['GET']);
restrictMethods(app, '/dashboard/clinics', ['GET']);


// 6) إضافة وتحرير وحذف عبر لوحة التحكم
restrictMethods(app, '/dashboard/add-doctor',    ['GET','POST']);
restrictMethods(app, '/dashboard/add-admin',     ['GET','POST']);
restrictMethods(app, '/dashboard/add-clinic',    ['GET','POST']);
restrictMethods(app, '/dashboard/add-lab',       ['GET','POST']);

restrictMethods(app, '/dashboard/edit-clinic/:id',  ['GET']);
restrictMethods(app, '/dashboard/update-clinic/:id',['POST']);

restrictMethods(app, '/dashboard/update-doctor/:id',['POST']);
restrictMethods(app, '/dashboard/delete-doctor/:id',['DELETE']);

restrictMethods(app, '/dashboard/edit-lab/:id',  ['GET']);
restrictMethods(app, '/dashboard/update-lab/:id',['POST']);
restrictMethods(app, '/dashboard/delete-lab/:id',['DELETE']);


// 7) حجوزات المرضى
restrictMethods(app, '/book-appointment/:doctorId',['POST']);
restrictMethods(app, '/appointments/:id',         ['DELETE']);


// 8) مختبر
restrictMethods(app, '/lab-write/:patientId',['GET']);
restrictMethods(app, '/send-lab-result',    ['POST']);
restrictMethods(app, '/lab-dashboard',      ['GET']);


// 9) بحث
restrictMethods(app, '/search-patients', ['GET']);
restrictMethods(app, '/search-clinics',  ['GET']);


// 10) إعادة تعيين كلمات المرور وعرض النتائج
restrictMethods(app, '/dashboard/user-search',         ['GET']);
restrictMethods(app, '/dashboard/user-reset-password',['POST']);


















// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/doctors', async (req, res) => {
  try {
    const doctors = (await db.get('doctors')) || [];
    res.render('doctors', { doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.render('doctors', { doctors: [] });
  }
});

app.get('/doctor/:id', async (req, res) => {
  try {
    const doctors = await db.get('doctors') || [];
    const doctor = doctors.find(d => d.id === parseInt(req.params.id));
    
    if (!doctor) {
      return res.status(404).render('error', { message: 'الطبيب غير موجود' });
    }
    
    // تأكد من وجود جدول المواعيد وإلا استخدم جدولاً افتراضياً
    const schedule = doctor.schedule || {
      sunday: { morning: "9 ص - 12 م", evening: "5 م - 9 م" },
      monday: { morning: "9 ص - 12 م", evening: "5 م - 9 م" },
      tuesday: { morning: "9 ص - 12 م", evening: "5 م - 9 م" },
      wednesday: { morning: "9 ص - 12 م", evening: "5 م - 9 م" },
      thursday: { morning: "9 ص - 12 م", evening: "5 م - 9 م" },
      friday: { morning: "إجازة", evening: "إجازة" },
      saturday: { morning: "إجازة", evening: "إجازة" }
    };


    const clinics = await db.get('clinics') || [];
    const doctorClinic = clinics.find(c => c.id === parseInt(doctor.clinicId));  
    res.render('doctor-profile', { 
      doctor: {
        ...doctor,
        schedule: schedule,
        clinicName: doctorClinic.name || "غير محدد"
      }
    });
    
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء جلب بيانات الطبيب' });
  }
});
app.get('/patient/:id', requirePatientAccess, async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patients = await db.get('patients') || [];
    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
      return res.status(404).send('المريض غير موجود');
    }

    const doctors = await db.get('doctors') || [];
    const prescriptions = await db.get('prescriptions') || [];
    const appointments = await db.get('appointments') || [];
    const labInfo = await db.get("labResults") || [];

    // حجوزات هذا المريض من جدول المواعيد
    const myAppointments = appointments
      .filter(app => app.patientId === patientId)
      .map(app => {
        const doctor = doctors.find(d => d.id === app.doctorId);
        return {
          ...app,
          doctorName: doctor?.name || 'غير معروف',
          specialty: doctor?.specialty || 'غير معروف'
        };
      });

    // التاريخ الطبي
    const medicalHistory = patient.medicalHistory.map(history => {
      const doctor = doctors.find(d => d.id === history.doctorId);
      const prescription = prescriptions.find(p => p.id === history.prescriptionId);
      return {
        ...history,
        doctorName: doctor?.name || 'غير معروف',
        prescription: prescription || null
      };
    });


    const labResults = labInfo.filter(app => app.patientId === patientId)
      

    res.render('patient-profile', {
      patient,
      appointments: myAppointments,
      medicalHistory,
      labResults
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).send('حدث خطأ أثناء جلب بيانات المريض');
  }
});

app.get('/prescription/:id', async (req, res) => {
  try {
    const prescriptions = await db.get('prescriptions') || [];
    const prescription = prescriptions.find(p => p.id === parseInt(req.params.id));
    
    if (!prescription) {
      return res.status(404).send('الوصفة الطبية غير موجودة');
    }
    
    const doctors = await db.get('doctors') || [];
    const patients = await db.get('patients') || [];
    
    const doctor = doctors.find(d => d.id === prescription.doctorId);
    const patient = patients.find(p => p.id === prescription.patientId);
    
    res.render('prescription', { 
      prescription, 
      doctor: doctor || { name: 'غير معروف', specialty: 'غير معروف' }, 
      patient: patient || { name: 'غير معروف', email: 'غير معروف' } 
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).send('حدث خطأ أثناء جلب بيانات الوصفة الطبية');
  }
});

// API Routes للبحث عن الأطباء
app.get('/api/doctors', requireSuperAdmin, async (req, res) => {
  try {
    let doctors = (await db.get('doctors')) || [];
    
    if (req.query.specialty) {
      doctors = doctors.filter(doctor => 
        doctor.specialty.toLowerCase().includes(req.query.specialty.toLowerCase())
      );
    }
    
    if (req.query.name) {
      doctors = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(req.query.name.toLowerCase())
      );
    }
    
    res.json(doctors);
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء البحث عن الأطباء' });
  }
});



// نظام تسجيل الدخول
app.get('/login', (req, res) => {
  res.render('login', { registered: req.query.registered === 'true' });
});

app.post('/login',verifyOrigin, async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) {
    return res.status(400).render("login", {error: "جميع الحقول مطلوبة"});
  }
  try {
    // البحث في جميع الحسابات (أطباء + مستخدمين عاديين)
    const doctors = await db.get('doctors') || [];
    const users = await db.get('users') || [];
    const allAccounts = [...doctors, ...users];
    
    const account = allAccounts.find(acc => 
      acc.username === username || acc.email === username
    );
    
    if (!account) {
      return res.render('login', { error: 'اسم المستخدم غير مسجل' });
    }
    
    if (!account.password) {
      return res.render('login', { 
        error: 'حساب غير مهيأ بشكل صحيح، الرجاء التواصل مع المسؤول' 
      });
    }
    
    const isMatch = await bcrypt.compare(password, account.password.trim());
    
    if (isMatch) {
    req.session.user = {
      id: account.id,
      username: account.username,
      name: account.name,
      role: account.role,
      image: account.image || 'https://via.placeholder.com/40', // أضفنا هذا
      specialty: account.specialty,
      ...(account.role === 'patient' && { patientId: account.patientId })
    };
      
      // التوجيه حسب نوع المستخدم
      switch(account.role) {
        case 'admin':
          return res.redirect('/dashboard');
        case 'doctor':
          return res.redirect('/doctor-dashboard');
        case 'lab':
          return res.redirect('/lab-dashboard');
        default:
          return res.redirect(`/patient/${account.patientId}`);
      }

       if (isMatch) {
    if (account.role === 'admin') {
      const users = await db.get('users') || [];
      const userIndex = users.findIndex(u => u.id === account.id);
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        await db.set('users', users);
      }
    }
    
    await logActivity(account.id, 'LOGIN', { ip: req.ip });
  }
    
    await logActivity(account.id, 'LOGIN', { ip: req.ip });
    } else {
      return res.render('login', { error: 'كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});


// إضافة middleware لتمرير بيانات المستخدم لجميع الصفحات
app.use(async (req, res, next) => {
  if (req.session.user) {
    res.locals.currentUser = req.session.user;
    
    // جلب بيانات المريض إذا كان مستخدم عادي
    if (req.session.user.role === 'patient') {
      const patients = await db.get('patients') || [];
      res.locals.currentPatient = patients.find(p => p.id === req.session.user.patientId);
    }
  }
  next();
});

// مسار تسجيل الخروج
app.get('/logout', (req, res) => {
  if (req.session.user) {
    logActivity(req.session.user.id, 'LOGOUT', {});
  }
  req.session.destroy();
  res.redirect('/login');
});

// لوحة التحكم (المسؤولين فقط)
app.get('/dashboard', requireAdmin, async (req, res) => {
  try {

    const messages = await db.get('messages') || [];
    const doctors = await db.get('doctors') || [];
    const patients = await db.get('patients') || [];
    const prescriptions = await db.get('prescriptions') || [];
    const clinics = await db.get("clinics")


    const logs = await db.get('activityLogs') || [];
    const users = await db.get('users') || [];
    const adminCount = users.filter(u => u.role === 'admin').length;
    const labCount = users.filter(u => u.role === 'lab').length;

    const logsWithUsernames = logs.map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        username: user?.username || 'غير معروف'
      };
    }).reverse(); // لعرض الأحدث أولاً

    
    
    res.render('dashboard', {
      doctorCount: doctors.length,
      patientCount: patients.length,
      prescriptionCount: prescriptions.length,
      doctors,
      clinicsCount: clinics.length,
      logsWithUsernames,
      adminCount,
      messages,
      labCount
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء تحميل لوحة التحكم' });
  }
});

// إضافة طبيب جديد (المسؤولين فقط)
app.get('/dashboard/add-doctor', requireAdmin, async (req, res) => {
  const clinics = await db.get('clinics') || [];
  res.render('add-doctor', { clinics });
});

app.post('/dashboard/add-doctor',verifyOrigin, requireAdmin, async (req, res) => {
  try {
    const { username, name, specialty, email, password, schedule, clinicId, image } = req.body;
    if(!username || !name || !specialty || !email || !password || !schedule || !clinicId || !image){
      return res.status(400).render("add-doctor", { error: "جميع الحقول مطلوبة"})
    }
    // تحويل جدول المواعيد من FormData إلى الهيكل المطلوب
    const formattedSchedule = {};
    Object.entries(schedule).forEach(([day, times]) => {
      formattedSchedule[day.toLowerCase()] = {
        morning: times.morning || "غير محدد",
        evening: times.evening || "غير محدد"
      };
    });

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newDoctor = {
      id: Date.now(),
      username,
      name,
      specialty,
      email,
      password: hashedPassword,
      image: image,
      role: "doctor",
      schedule: formattedSchedule, // حفظ جدول المواعيد
      rating: 0,
      reviews: 0,
      clinicId: parseInt(clinicId), // ربط العيادة بالدكتور

    };
    
    await logActivity(req.session.user.id, 'ADD_DOCTOR', { doctorId: newDoctor.id });
    await db.push('doctors', newDoctor);
   return res.redirect('/dashboard?doctorAdded=true');
  
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.render('add-doctor', { error: 'حدث خطأ أثناء إضافة الطبيب' });
  }
});
// نظام التسجيل
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register',verifyOrigin, async (req, res) => {
  try {
    const { username, password, name, email, phone } = req.body;
    if(!username || !password || !name || !email || !phone){
      return res.status(400).render("register", {error: 'جميع الحقول مطلوبة'})
    }
    // التحقق من عدم وجود مستخدم بنفس الاسم
    const users = await db.get('users') || [];
    if (users.some(u => u.username === username)) {
      return res.render('register', { error: 'اسم المستخدم موجود مسبقاً' });
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // إنشاء المريض الجديد
    const patients = await db.get('patients') || [];
    const newPatientId = patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1;
    
    const newPatient = {
      id: newPatientId,
      name,
      email,
      phone,
      image: "https://via.placeholder.com/150",
      appointments: [],
      medicalHistory: []
    };
    
    // إنشاء حساب المستخدم مع كلمة المرور المشفرة
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password: hashedPassword, // حفظ كلمة المرور المشفرة
      role: "patient",
      patientId: newPatientId
    };
    
    await db.push('patients', newPatient);
    await db.push('users', newUser);
    
    res.redirect('/login?registered=true');
  } catch (error) {
    console.error('Error during registration:', error);
    res.render('register', { error: 'حدث خطأ أثناء التسجيل' });
  }
});


// صفحة كتابة الوصفة الطبية (للأطباء فقط)
app.get('/write-prescription/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const patients = await db.get('patients') || [];
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) {
      return res.status(404).render('error', { message: 'المريض غير موجود' });
    }
    
    res.render('write-prescription', { patient, doctor: req.session.user });
  } catch (error) {
    console.error('Error loading prescription page:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء تحميل صفحة الوصفة' });
  }
});

// معالجة إرسال الوصفة الطبية
app.post('/submit-prescription',verifyOrigin, async (req, res) => {
  try {
    const { patientId, doctorId, diagnosis, medications, instructions, analysis } = req.body;
    if(!patientId || !doctorId || !diagnosis || !medications || !instructions || !analysis){
      return res.status(400).render("write-prescription", {error: "جميع الحقول مطلوبة"})
    }
    // تحويل medications من سلسلة نصية إلى مصفوفة
    const medicationsArray = medications.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [name, dosage, frequency, duration] = line.split('|').map(item => item.trim());
        return { name, dosage, frequency, duration };
      });
    
    // تحويل instructions من سلسلة نصية إلى مصفوفة
    const instructionsArray = instructions.split('\n')
      .filter(line => line.trim() !== '');
    
    // إنشاء الوصفة الجديدة
    const prescriptions = await db.get('prescriptions') || [];
    const newPrescriptionId = prescriptions.length > 0 ? Math.max(...prescriptions.map(p => p.id)) + 1 : 1;
    
    const newPrescription = {
      id: newPrescriptionId,
      patientId: parseInt(patientId),
      doctorId: parseInt(doctorId),
      date: new Date().toISOString().split('T')[0],
      diagnosis,
      medications: medicationsArray,
      instructions: instructionsArray,
      analysis: analysis
    };
    
    // إضافة الوصفة إلى قاعدة البيانات
    await db.push('prescriptions', newPrescription);
    
    // إضافة الوصفة إلى سجل المريض
    const patients = await db.get('patients') || [];
    const patientIndex = patients.findIndex(p => p.id === parseInt(patientId));
    
    if (patientIndex !== -1) {
      patients[patientIndex].medicalHistory = patients[patientIndex].medicalHistory || [];
      patients[patientIndex].medicalHistory.push({
        id: Date.now(),
        doctorId: parseInt(doctorId),
        date: new Date().toISOString().split('T')[0],
        diagnosis,
        prescriptionId: newPrescriptionId
      });
      
      await db.set('patients', patients);
    }
    
     await logActivity(req.session.user.id, 'WRITE_PRESCRIPTION', { 
      patientId: req.body.patientId,
      prescriptionId: newPrescriptionId 
    });

    res.redirect(`/patient/${patientId}?prescriptionSuccess=true`);
  } catch (error) {
    console.error('Error submitting prescription:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء حفظ الوصفة' });
  }
});


// مسار لوحة تحكم الطبيب
app.get('/doctor-dashboard', requireDoctor, async (req, res) => {
  try {
    const doctorId = req.session.user?.id;
    const appointments = (await db.get('appointments')) || [];
    const patients = (await db.get('patients')) || [];

    const myAppointments = appointments
      .filter(app => app.doctorId === doctorId)
      .map(app => {
        const patient = patients.find(p => p.id === app.patientId);
        return {
          ...app,
          patientName: patient?.name || 'غير معروف',
          patientId: patient?.id || 'N/A',
          patientPhone: patient?.phone || 'غير مسجل'
        };
      });

    res.render('doctor-dashboard', { appointments: myAppointments });
  } catch (error) {
    console.error('Error loading doctor dashboard:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء تحميل الحجوزات' });
  }
});


// صفحة إنشاء حساب مسؤول (للمسؤولين فقط)
app.get('/dashboard/add-admin', requireSuperAdmin, (req, res) => {
  res.render('create-admin');
});
//requireAdmin,
// معالجة إنشاء حساب مسؤول
app.post('/dashboard/add-admin',verifyOrigin, requireSuperAdmin,async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    if(!username || !password || !name || !email){
      return res.status(400).render('create-admin', {error: 'جميع الحقول مطلوبة'})
    }
    // التحقق من عدم وجود مستخدم بنفس الاسم
    const users = await db.get('users') || [];
    if (users.some(u => u.username === username)) {
      return res.render('create-admin', { error: 'اسم المستخدم موجود مسبقاً' });
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // إنشاء حساب المسؤول الجديد
    const newAdmin = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password: hashedPassword,
      role: "admin",
      name,
      email
    };
    
    await db.push('users', newAdmin);
    
    res.redirect('/dashboard?adminCreated=true');
  } catch (error) {
    console.error('Error creating admin account:', error);
    res.render('create-admin', { error: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});
//
// مسار البحث عن المرضى (للأطباء فقط)
app.get('/search-patients', requireDoctorAndLab, async (req, res) => {
  try {
    const searchQuery = req.query.query ? req.query.query.trim() : '';
    const patients = await db.get('patients') || [];
    
    // تصفية المرضى بناء على بحث غير حساس لحالة الأحرف
    const filteredPatients = patients.filter(patient => {
      if (!searchQuery) return false; // لا تعرض نتائج إذا كان البحث فارغاً
      
      const searchFields = [
        patient.name,
        patient.email,
        patient.phone,
        patient.id.toString()
      ].filter(Boolean); // تجاهل الحقول الفارغة
      
      return searchFields.some(field => 
        field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    
    res.render('search-patients', {
      patients: filteredPatients,
      searchQuery,
      resultsCount: filteredPatients.length
    });
    
  } catch (error) {
    console.error('Error in patient search:', error);
    res.status(500).render('error', {
      message: 'حدث خطأ في نظام البحث',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// مسار عرض جميع المرضى (للمسؤول فقط)
app.get('/dashboard/patients', requireAdmin, async (req, res) => {
  try {
    const patients = await db.get('patients') || [];
    const users = await db.get('users') || [];
    
    // دمج بيانات المرضى مع بيانات المستخدمين
    const patientsData = patients.map(patient => {
      const user = users.find(u => u.patientId === patient.id);
      return {
        ...patient,
        username: user?.username || 'غير معروف',
        password: user?.password ? '********' : 'غير معين'
      };
    });
    
    res.render('admin-patients', { patients: patientsData });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء جلب بيانات المرضى' });
  }
});

// مسار عرض جميع الأطباء (للمسؤول فقط)
app.get('/dashboard/doctors', requireAdmin, async (req, res) => {
  try {
    const doctors = await db.get('doctors') || [];
    
    const clinics = await db.get('clinics') || [];


    res.render('admin-doctors', { doctors, clinics });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء جلب بيانات الأطباء' });
  }
});

// مسار تحديث بيانات الطبيب
app.post('/dashboard/update-doctor/:id', verifyOrigin,requireAdmin, async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const { name, specialty, hospital, email, username } = req.body;
    if(!name || !specialty || !hospital || !email || !username){
      return;
    }
    let doctors = await db.get('doctors') || [];
    const doctorIndex = doctors.findIndex(d => d.id === doctorId);
    
    if (doctorIndex === -1) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }
    
    // تحديث البيانات
    doctors[doctorIndex] = {
      ...doctors[doctorIndex],
      name,
      specialty,
      hospital,
      email,
      username
    };
    
    await db.set('doctors', doctors);
    res.json({ success: true, message: 'تم تحديث بيانات الطبيب بنجاح' });
    
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحديث' });
  }
});

// مسار حذف الطبيب
app.delete('/dashboard/delete-doctor/:id', requireAdmin, async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    let doctors = await db.get('doctors') || [];
    
    doctors = doctors.filter(d => d.id !== doctorId);
    await db.set('doctors', doctors);
    
    res.json({ success: true, message: 'تم حذف الطبيب بنجاح' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء الحذف' });
  }
});
////
// دالة لتسجيل النشاطات
async function logActivity(userId, action, details) {
  const logs = await db.get('activityLogs') || [];
  logs.push({
    id: Date.now(),
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  await db.set('activityLogs', logs);
}


// مسار عرض جميع المسؤولين
app.get('/dashboard/admins', requireSuperAdmin, async (req, res) => {
  try {
    const users = await db.get('users') || [];
    const admins = users.filter(u => u.role === 'admin');
    res.render('admin-admins', { admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء جلب بيانات المسؤولين' });
  }
});

// مسار حذف مسؤول
app.delete('/dashboard/delete-admin/:id', requireSuperAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    let users = await db.get('users') || [];
    
    users = users.filter(u => !(u.id === adminId && u.role === 'admin' && u.username !== 'admin'));
    await db.set('users', users);
    
    await logActivity(req.session.user.id, 'DELETE_ADMIN', { adminId });
    res.json({ success: true, message: 'تم حذف المسؤول بنجاح' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء الحذف' });
  }
});

// مسار سجل النشاطات
app.get('/dashboard/activity-logs', requireAdmin, async (req, res) => {
  try {
    const logs = await db.get('activityLogs') || [];
    const users = await db.get('users') || [];
    
    const logsWithUsernames = logs.map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        username: user?.username || 'غير معروف'
      };
    }).reverse(); // لعرض الأحدث أولاً
    
    res.render('admin-activity-logs', { logs: logsWithUsernames });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء جلب سجل النشاطات' });
  }
});
app.delete('/dashboard/delete-patient/:id', requireAdmin, async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);

    let patients = await db.get('patients') || [];
    let users = await db.get('users') || [];

    // احذف المريض من جدول المرضى
    patients = patients.filter(p => p.id !== patientId);
    await db.set('patients', patients);

    // احذف المستخدم المرتبط بالمريض
    users = users.filter(u => !(u.role === 'patient' && u.patientId === patientId));
    await db.set('users', users);

    // سجل العملية في الـ logs
    await logActivity(req.session.user.id, 'DELETE_PATIENT', { patientId });

    res.redirect('/dashboard/patients');
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء حذف المريض' });
  }
});
app.get('/dashboard/clinics', requireAdmin, async (req, res) => {
  const clinics = await db.get('clinics') || [];
  res.render('admin-clinics', { clinics });
});
app.get('/dashboard/add-clinic', requireAdmin, (req, res) => {
  res.render('add-clinic');
});
app.post('/dashboard/add-clinic',verifyOrigin, requireAdmin, async (req, res) => {
  const { name, location, description, schedule } = req.body;
  if(!name || !location || !description || !schedule){
    return res.status(400).render('add-clinic', {error: 'جميع الحقول مطلوبة'})
  }

  const formattedSchedule = {};
    Object.entries(schedule).forEach(([day, times]) => {
      formattedSchedule[day.toLowerCase()] = {
        morning: times.morning || "غير محدد"
      };
    });
  const clinics = await db.get('clinics') || [];
  const newClinic = {
    id: Date.now(),
    name,
    location,
    description,
    schedule: formattedSchedule
  };

  await db.push('clinics', newClinic);
  await logActivity(req.session.user.id, 'ADD_CLINIC', { clinicId: newClinic.id });

  res.redirect('/dashboard/clinics');
});
app.get('/clinic/:id', async (req, res) => {
  const clinics = await db.get('clinics') || [];
  const doctors = await db.get('doctors') || [];
  const users   = await db.get('users') || [];

  const clinic = clinics.find(c => c.id === parseInt(req.params.id));
  if (!clinic) {
    return res.status(404).render('error', { message: 'العيادة غير موجودة' });
  }
  const clinicLabs = users.filter(u => u.role === 'lab' && u.clinicId === clinic.id);
  const clinicDoctors = doctors.filter(d => d.clinicId === clinic.id);

  res.render('clinic-info', { clinic, doctors: clinicDoctors, labs: clinicLabs, schedule: clinic.schedule });
});
app.get('/dashboard/clinics', requireAdmin, async (req, res) => {
  try {
    const clinic = await db.get('clinics') || [];
    res.render('admin-clinics', { clinic });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء جلب العيادات' });
  }
});
app.get('/dashboard/edit-clinic/:id', requireAdmin, async (req, res) => {
  const clinicId = parseInt(req.params.id);
  const clinics = await db.get('clinics') || [];

  const clinic = clinics.find(c => c.id === clinicId);
  if (!clinic) {
    return res.status(404).render('error', { message: 'العيادة غير موجودة' });
  }

  res.render('edit-clinic', { clinic });
});
app.post('/dashboard/update-clinic/:id',verifyOrigin, async (req, res) => {
  const clinicId = parseInt(req.params.id);
  const { name, location, description, schedule } = req.body;
  if(!name || !location || !description || !schedule){
    return res.status(400).render('edit-clinic', {error: "جميع الحقول مطلوبة"})
  }
   const formattedSchedule = {};
    Object.entries(schedule).forEach(([day, times]) => {
      formattedSchedule[day.toLowerCase()] = {
        morning: times.morning || "غير محدد"
      };
    });
  let clinics = await db.get('clinics') || [];
  const clinicIndex = clinics.findIndex(c => c.id === clinicId);

  if (clinicIndex === -1) {
    return res.status(404).render('error', { message: 'العيادة غير موجودة' });
  }

  clinics[clinicIndex] = {
    ...clinics[clinicIndex],
    name,
    location,
    description,
    schedule: formattedSchedule
  };

  await db.set('clinics', clinics);
  await logActivity(req.session.user.id, 'UPDATE_CLINIC', { clinicId });

  res.redirect('/dashboard/clinics');
});
app.get('/search-clinics', async (req, res) => {
  const query = req.query.query?.trim().toLowerCase() || '';
  const clinics = await db.get('clinics') || [];

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(query) || 
    c.location.toLowerCase().includes(query)
  );

  res.render('search-clinics', {
    clinics: filtered,
    query
  });
});

app.post('/book-appointment/:doctorId',verifyOrigin, async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    const patientId = req.session.user?.patientId;

    if (!patientId) {
     return res.status(500).render('error', { message: 'يجب ان تكون مسجلا كمريض لحجز موعد' });
    }

    const { date, time } = req.body;
    if (!date || !time){
      return res.status(400).render('error', { error: 'جميع الحقول مطلوبة'})
    }
    const appointments = await db.get('appointments') || [];

    const newAppointment = {
      id: Date.now(),
      doctorId,
      patientId,
      date,
      time,
      status: 'pending'
    };

    await db.push('appointments', newAppointment);
    await logActivity(patientId, 'BOOK_APPOINTMENT', { doctorId, date, time, id: Date.now() });

    res.redirect(`/doctor/${doctorId}?booked=true`);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).send('حدث خطأ أثناء الحجز');
  }
});
app.delete('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const user = req.session.user;
  if(!user) {return
    res.status(403).send('تزحلك حبي');
  }
    const appointments = await db.get('appointments') || [];
    const target = appointments.find(a => a.id === appointmentId);

    if (!target) {
      return res.status(404).send('الحجز غير موجود');
    }

    // تحقق من صلاحية الحذف
    const isDoctor = user.role === 'doctor' && user.id === target.doctorId;
    const isPatient = user.role === 'patient' && user.patientId === target.patientId;

    if (!isDoctor && !isPatient) {
      return res.status(403).send('غير مصرح بالحذف');
    }

    // حذف الحجز
    const updatedAppointments = appointments.filter(a => a.id !== appointmentId);
    await db.set('appointments', updatedAppointments);

    await logActivity(user.id, 'DELETE_APPOINTMENT', { appointmentId });

    // توجيه حسب الدور
    if (isDoctor) return res.redirect('/doctor-dashboard');
    if (isPatient) return res.redirect(`/patient/${user.patientId}`);
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).send('حدث خطأ أثناء حذف الحجز');
  }
});








app.get('/help', async (req, res) => {
  const error = false;
  res.render('help', { req, error });
});

app.post('/help', verifyOrigin, async (req, res) => {
  try {

    const { num, title, message } = req.body;
    if (!num || !title || !message) {
      return res.status(400).render("help", {req, error: 'جميع الحقول مطلوبة' });
    }

    const messages = await db.get('messages') || [];


    // 🛡️ تحديد عنوان IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // 🕒 التحقق من آخر رسالة من نفس IP
    const lastSent = messages
      .filter(msg => msg.ip === ip)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;
    const remainingTime = TEN_MINUTES - (now - new Date(lastSent.date).getTime());

    if (lastSent && now - new Date(lastSent.date).getTime() < TEN_MINUTES) {
      return res.status(429).render('help', {
        remainingTime,
        req,
        error: '⏳ يمكنك إرسال رسالة واحدة فقط كل 10 دقائق من نفس الجهاز.'
      });
    }

    const newMessage = {
      id: Date.now(),
      num,
      title,
      message,
      ip, // 🛡️ تخزين عنوان IP
      date: new Date().toISOString()
    };
    await db.push('messages', newMessage);
    await logActivity(req.session.user?.id || 'anonymous', 'SEND_MESSAGE', { num });

    res.redirect('/help?sent=true');
  } catch (error) {
    console.error('Error receiving message:', error);
    res.status(500).send('حدث خطأ أثناء إرسال الرسالة');
  }
});
app.get('/dashboard/messages', requireAdmin, async (req, res) => {
  try {
    const messages = await db.get('messages') || [];
    res.render('admin-messages', { messages });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).render('error', { message: 'فشل تحميل الرسائل' });
  }
});




























































app.get('/lab-write/:patientId', requireLab, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(403).send('يجب أن تكون مسجلاً كطبيب للحجز');
    }
    const patientId = parseInt(req.params.patientId);
    const patients = await db.get('patients') || [];
    const patient = patients.find(p => p.id === patientId);
    const labUser = req.session.user;
    
    if (!patient) {
      return res.status(404).render('error', { message: 'المريض غير موجود' });
    }
    
  res.render('write-lab-result', { patient, labUser });
  } catch (error) {
    console.error('Error loading prescription page:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء تحميل صفحة الوصفة' });
  }
});


// معالجة إرسال الوصفة الطبية
app.post('/send-lab-result',verifyOrigin,requireLab, async (req, res) => {
  try {
    
const patients = db.get("patients")
const { patientId, type, content } = req.body;
if(!patientId || !type || !content){
  return res.status(400).render('write-lab-result', {error: 'جميع الحقول مطلوبة'})
}
  const labId = req.session.user.id;
const patient = patients.find(p => p.id === patientId);
if (!patient) return res.status(404).send('المريض غير موجود');
  const newResult = {
    id: Date.now(),
    patientId: parseInt(patientId),
    labId,
    type,
    content,
    date: new Date().toISOString().split("T")[0]
  };

  await db.push('labResults', newResult);

   await logActivity(labId, 'SEND_LAB_RESULT', { resultId: newResult.id });


    res.redirect(`/patient/${patientId}`);
  } catch (error) {
    console.error('Error submitting prescription:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء حفظ المعلومات' });
  }
});

app.get("/lab-dashboard", requireLab,async(req, res) => {
  if (!req.session.user) {
      return res.status(403).send('يجب أن تكون مسجلاً كطبيب للحجز');
    }
    const doctors = await db.get('users') || [];
    const doctor = doctors.find(d => d.id === parseInt(req.session.user.id));
    const clinics = await db.get('clinics') || [];
    const doctorClinic = clinics.find(c => c.id === parseInt(doctor.clinicId));
  res.render('lab-dashboard', { clinicName: doctorClinic.name });

})



app.get('/dashboard/add-lab', requireAdmin, async (req, res) => {
  const clinics = await db.get('clinics') || [];
  res.render('add-lab', { clinics });
});
app.post('/dashboard/add-lab',verifyOrigin, requireAdmin, async (req, res) => {
  try {
  const { username, name, email, password, clinicId } = req.body;
  if(!username || !name || !email || !password || !clinicId){
    return res.status(400).render('add-lab', {error: "جميع الحقول مطلوبة"})
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newLab = {
    id: Date.now(),
    username,
    name,
    email,
    password: hashedPassword,
    role: "lab",
    clinicId: parseInt(clinicId)
  };
  console.log(newLab)
  await db.push('users', newLab);
  await logActivity(req.session.user.id, 'ADD_LAB_USER', { labId: newLab.id });
  res.redirect('/dashboard/');
} catch (error) {
    console.error('Error add lab:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء حفظ المعلومات' });
  }
});
app.get('/dashboard/labs', requireAdmin, async (req, res) => {
  const users   = await db.get('users') || [];
  const clinics = await db.get('clinics') || [];

  const labs = users.filter(u => u.role === 'lab').map(lab => {
    const clinic = clinics.find(c => c.id === lab.clinicId);
    return {
      ...lab,
      clinicName: clinic ? clinic.name : 'غير محددة'
    };
  });

  res.render('admin-labs', { labs });
});
app.get('/dashboard/edit-lab/:id', requireAdmin, async (req, res) => {
  const labId = parseInt(req.params.id);
  const users = await db.get('users') || [];
  const clinics = await db.get('clinics') || [];

  const lab = users.find(u => u.id === labId && u.role === 'lab');
  if (!lab) return res.status(404).render('error', { message: 'المختبر غير موجود' });

  res.render('edit-lab', { lab, clinics });
});
app.post('/dashboard/update-lab/:id',verifyOrigin, requireAdmin, async (req, res) => {
  try {
  const labId = parseInt(req.params.id);
  const { name, username, email, clinicId } = req.body;
  if(!name || !username || !email || !clinicId){
    return res.status(400).render('edit-lab', {error: "جميع الحقول مطلوبة"})
  }
  const users = await db.get('users') || [];
  const index = users.findIndex(u => u.id === labId && u.role === 'lab');

  if (index === -1) return res.status(404).render('error', { message: 'المختبر غير موجود' });

  users[index] = {
    ...users[index],
    name,
    username,
    email,
    clinicId: parseInt(clinicId)
  };

  await db.set('users', users);
  await logActivity(req.session.user.id, 'UPDATE_LAB', { labId });

  res.redirect('/dashboard/labs');
  } catch (error) {
    console.error('Error update lab:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء حفظ المعلومات' });
  }

});
app.delete('/dashboard/delete-lab/:id', requireAdmin, async (req, res) => {
 try{
  const labId = parseInt(req.params.id);
  let users = await db.get('users') || [];

  // حذف المختبر حسب الدور
  users = users.filter(u => !(u.id === labId && u.role === 'lab'));
  await db.set('users', users);

  await logActivity(req.session.user.id, 'DELETE_LAB', { labId });
  res.redirect('/dashboard/labs');
 }catch (error) {
    console.error('Error delete lab:', error);
    res.status(500).render('error', { message: 'حدث خطأ أثناء حفظ المعلومات' });
  }
});































































































// --- 1) عرض نموذج رقم الجوال
app.get('/register-phone', (req, res) => {
  res.render('register-phone', { error: null });
});

// --- 2) استلام رقم الجوال وإرسال OTP
app.post('/register-phone',verifyOrigin, async (req, res) => {
  const { phone } = req.body;
  if(!phone) {
    return res.status(400).render("register-phone", {error: "رقم الهاتف مطلوب"})
  }
  const otps = await db.get('otps') || [];

  // توليد كود 6 أرقام
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // خمس دقائق صلاحية

  // خلِّص أي رمز قديم لنفس الرقم
  const filtered = otps.filter(o => o.phone !== phone);
  filtered.push({ phone, code, expiresAt, verified: false });

  await db.set('otps', filtered);

  // أرسل الرسالة عبر Twilio
  try {
    await twilio.messages.create({
      body: `رمز التحقق لموقعنا: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    res.redirect(`/verify-otp?phone=${encodeURIComponent(phone)}`);
  } catch (err) {
    console.error('SMS Error:', err);
    res.render('register-phone', { error: 'فشل إرسال الرسالة، حاول لاحقاً' });
  }
});

// --- 3) عرض نموذج إدخال كود OTP
app.get('/verify-otp', (req, res) => {
  res.render('verify-otp', { phone: req.query.phone, error: null });
});

// --- 4) تحقق من الكود
app.post('/verify-otp',verifyOrigin, async (req, res) => {
  const { phone, code } = req.body;
  if(!phone || !code){
    return res.status(400).render("verify-otp", {error: "الكود مطلوب"})
  }
  const otps = await db.get('otps') || [];
  const rec = otps.find(o => o.phone === phone && o.code === code);

  if (!rec) {
    return res.render('verify-otp', { phone, error: 'الرمز غير صحيح' });
  }
  if (Date.now() > rec.expiresAt) {
    return res.render('verify-otp', { phone, error: 'انتهت صلاحية الرمز' });
  }

  // علم عنه
  rec.verified = true;
  await db.set('otps', otps);

  res.redirect(`/register-details?phone=${encodeURIComponent(phone)}`);
});

// --- 5) عرض نموذج بيانات التسجيل
app.get('/register-details', (req, res) => {
  res.render('register-details', { phone: req.query.phone, error: null });
});

// --- 6) إنشاء الحساب بعد التحقق
app.post('/register-details',verifyOrigin, async (req, res) => {
  const { phone, username, password, name, email } = req.body;
  if(!phone || !username || !password || !name){
    return res.status(400).render('register-details', {error : "جميع الجقول مطلوبة"})
  }
  const otps = await db.get('otps') || [];
  const rec = otps.find(o => o.phone === phone && o.verified);

  if (!rec) {
    return res.redirect('/register-phone');
  }

  // التحقق من عدم تكرار اسم المستخدم أو رقم الجوال
  const users = await db.get('users') || [];
  if (users.some(u => u.username === username)) {
    return res.render('register-details', { phone, error: 'اسم المستخدم موجود' });
  }
  const patients = await db.get('patients') || [];
  if (patients.some(p => p.phone === phone)) {
    return res.render('register-details', { phone, error: 'رقم الجوال مسجل مسبقاً' });
  }

  // تشفير الباسورد
  const hashed = await bcrypt.hash(password, saltRounds);

  // إنشاء سجل المريض
  const newPatientId = patients.length
    ? Math.max(...patients.map(p => p.id)) + 1
    : 1;
  const newPatient = {
    id: newPatientId,
    name,
    email,
    phone,
    image: 'https://via.placeholder.com/150',
    appointments: [],
    medicalHistory: []
  };
  await db.push('patients', newPatient);

  // إنشاء حساب المستخدم
  const newUserId = users.length
    ? Math.max(...users.map(u => u.id)) + 1
    : 1;
  const newUser = {
    id: newUserId,
    username,
    password: hashed,
    role: 'patient',
    patientId: newPatientId,
    name,
    email,
    image: newPatient.image,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  await db.push('users', newUser);

  // مسح رمز التحقق (اختياري)
  const remainOtps = otps.filter(o => o.phone !== phone);
  await db.set('otps', remainOtps);

  // ربط الجلسة وتوجيه للمريض
  req.session.user = {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    patientId: newUser.patientId,
    image: newUser.image
  };
  res.redirect(`/patient/${newPatientId}`);
});
























































































































































// عرض صفحة البحث
app.get('/dashboard/user-search', requireSuperAdmin, async (req, res) => {
  const query = req.query.query || ''.trim().toLowerCase();

  // جلب كل المجموعات
  const doctors  = await db.get('doctors') || [];
  const users    = await db.get('users') ||  [];
  const patients = await db.get('patients') || [];

  // دمجهم في مصفوفة موحدة
  const accounts = [
    ...doctors.map(acc => ({ ...acc, _source: 'doctors' })),
    ...users  .map(acc => ({ ...acc, _source: 'users'  }))
  ].map(acc => {
    const patient = acc.role === 'patient'
      ? patients.find(p => p.id === acc.patientId) || {}
      : {};
    return {
      id:       acc.id,
      username: acc.username,
      email:    acc.email || patient.email || '',
      phone:    acc.phone || patient.phone || '',
      role:     acc.role,
      name:     acc.name || patient.name || '',
      _source:  acc._source
    };
  });

  // فلترة النتائج
  const results = query
    ? accounts.filter(u =>
        u.id.toString()        === query ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)    ||
        u.phone.toLowerCase().includes(query)
      )
    : [];

  res.render('admin-user-search', { query, results });
});


// تحديث كلمة المرور بجزء منفصل
app.post('/dashboard/user-reset-password',verifyOrigin, requireAdmin, async (req, res) => {
  const { userId, source, newPassword } = req.body;
  if(!userId || !source || !newPassword){
    return res.status(400).render("admin-user-search", {error: "جميع الحقول مطلوبة"})
  }
  const id = parseInt(userId);

  // تشفير الباسورد الجديد
  const hashed = await bcrypt.hash(newPassword, saltRounds);

  if (source === 'doctors') {
    const docs = (await db.get('doctors')) || [];
    const idx = docs.findIndex(d => d.id === id);
    if (idx !== -1) {
      docs[idx].password = hashed;
      await db.set('doctors', docs);
    }
  } else {
    const us = (await db.get('users')) || [];
    const idx = us.findIndex(u => u.id === id);
    if (idx !== -1) {
      us[idx].password = hashed;
      await db.set('users', us);
    }
  }

  // سجل النشاط
  await logActivity(req.session.user.id, 'RESET_PASSWORD', {
    targetId: id,
    source,
  });

  res.redirect(`/dashboard/user-search?query=${userId}`);
});
































app.get('/reset-admin-password', async (req, res) => {
  try {
    const users = await db.get('users') || [];
    const admin = users.find(u => u.role === 'admin');
    
    if (admin) {
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      admin.password = hashedPassword;
      await db.set('users', users);
      res.send('تم تحديث كلمة مرور المسؤول بنجاح');
    } else {
      res.status(404).send('لا يوجد حساب مسؤول');
    }
  } catch (error) {
    console.error('Error resetting admin password:', error);
    res.status(500).send('حدث خطأ أثناء تحديث كلمة المرور');
  }
});
















// بدء الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server ready http://localhost:${PORT}`);
});
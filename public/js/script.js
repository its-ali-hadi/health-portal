// تسجيل الدخول ونافذة المودال
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('login-btn');
    const modal = document.getElementById('login-modal');
    const closeBtn = document.querySelector('.close');
    const registerLink = document.getElementById('register-link');
    


    
    // طباعة الوصفة الطبية
    const printBtn = document.querySelector('.print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    // حفظ الوصفة كملف PDF
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            alert('سيتم حفظ الوصفة الطبية كملف PDF');
            // هنا يمكنك إضافة منطق التحويل إلى PDF
        });
    }
});

// يمكنك إضافة المزيد من الوظائف حسب الحاجة

  function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  }


// تسجيل الدخول
document.addEventListener('DOMContentLoaded', function() {


    // تأكيد قبل حذف الأطباء
    const deleteButtons = document.querySelectorAll('.delete-doctor');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) {
                e.preventDefault();
            }
        });
    });

    // البحث عن الأطباء
    const searchForm = document.getElementById('doctor-search');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const specialty = document.getElementById('specialty').value;
            const doctorName = document.getElementById('doctor-name').value;
            
            fetch(`/api/doctors?specialty=${specialty}&name=${doctorName}`)
                .then(response => response.json())
                .then(doctors => {
                    const container = document.getElementById('doctors-container');
                    container.innerHTML = '';
                    
                    if (doctors.length === 0) {
                        container.innerHTML = '<p class="no-doctors">لا توجد نتائج مطابقة</p>';
                        return;
                    }
                    
                    doctors.forEach(doctor => {
                        const card = document.createElement('div');
                        card.className = 'doctor-card';
                        card.innerHTML = `
                            <img src="${doctor.image}" alt="صورة الطبيب">
                            <h3>${doctor.name}</h3>
                            <p class="specialty">${doctor.specialty}</p>
                            <p class="hospital">${doctor.hospital}</p>
                            <a href="/doctor/${doctor.id}" class="btn">عرض الملف الشخصي</a>
                        `;
                        container.appendChild(card);
                    });
                });
        });
    }
});

// التحقق من صحة نموذج التسجيل
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        const password = document.getElementById('password').value;
        if (password.length < 6) {
            alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            e.preventDefault();
        }
    });
}


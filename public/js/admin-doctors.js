document.addEventListener('DOMContentLoaded', function() {
    // تفعيل وضع التعديل
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            row.querySelectorAll('.editable').forEach(cell => {
                const value = cell.textContent;
                const field = cell.getAttribute('data-field');
                cell.innerHTML = `<input type="text" value="${value}" data-original="${value}">`;
            });
            
            row.querySelector('.btn-save').style.display = 'inline-block';
            row.querySelector('.btn-cancel').style.display = 'inline-block';
            this.style.display = 'none';
        });
    });
    
    // إلغاء التعديلات
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            row.querySelectorAll('.editable').forEach(cell => {
                const originalValue = cell.querySelector('input').getAttribute('data-original');
                cell.textContent = originalValue;
            });
            
            row.querySelector('.btn-save').style.display = 'none';
            row.querySelector('.btn-cancel').style.display = 'none';
            row.querySelector('.btn-edit').style.display = 'inline-block';
        });
    });
    
    // حفظ التعديلات
    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', async function() {
            const row = this.closest('tr');
            const doctorId = row.getAttribute('data-doctor-id');
            const updatedData = {};
            
            row.querySelectorAll('.editable').forEach(cell => {
                const field = cell.getAttribute('data-field');
                updatedData[field] = cell.querySelector('input').value;
            });
            
            try {
                const response = await fetch(`/admin/update-doctor/${doctorId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    location.reload(); // إعادة تحميل الصفحة بعد التحديث
                } else {
                    alert('فشل في التحديث: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ أثناء التحديث');
            }
        });
    });
    
    // حذف الطبيب
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
            
            const row = this.closest('tr');
            const doctorId = row.getAttribute('data-doctor-id');
            
            try {
                const response = await fetch(`/dashboard/delete-doctor/${doctorId}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    row.remove();
                } else {
                    alert('فشل في الحذف: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ أثناء الحذف');
            }
        });
    });
});
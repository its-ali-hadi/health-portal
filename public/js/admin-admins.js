document.addEventListener('DOMContentLoaded', function() {
    // حذف مسؤول
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('هل أنت متأكد من حذف هذا المسؤول؟ لا يمكن التراجع عن هذا الإجراء.')) return;
            
            const row = this.closest('tr');
            const adminId = row.getAttribute('data-admin-id');
            
            try {
                const response = await fetch(`/dashboard/delete-admin/${adminId}`, {
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
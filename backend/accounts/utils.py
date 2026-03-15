from .models import ActivityLog


def log_activity(user, action, target_type, target_name, department=None, details=''):
    """
    Log a user activity.
    
    Args:
        user: User performing the action
        action: One of 'create', 'update', 'delete', 'publish', 'grade'
        target_type: e.g. 'مادة', 'محاضرة', 'واجب', 'نتيجة'
        target_name: Name/description of the target
        department: Department instance (optional)
        details: Optional extra details
    """
    if user and user.is_authenticated:
        ActivityLog.objects.create(
            user=user,
            action=action,
            target_type=target_type,
            target_name=str(target_name),
            department=department,
            details=str(details) if details else '',
        )

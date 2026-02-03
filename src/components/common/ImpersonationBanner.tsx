import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { LogOut, Eye, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ImpersonationBanner() {
  const { isImpersonating, target, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating || !target) return null;

  const handleExit = () => {
    stopImpersonation();
    // Navigate back to original dashboard
    if (target.type === 'tenant_admin') {
      navigate('/super-admin');
    } else if (target.type === 'member') {
      navigate('/dashboard');
    }
  };

  return (
    <div className="bg-warning/20 border-b border-warning/30 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">
            {target.type === 'tenant_admin' ? (
              <>
                <Building2 className="inline h-4 w-4 mr-1" />
                Viewing as Tenant Admin: <strong>{target.tenantName}</strong>
              </>
            ) : (
              <>
                <User className="inline h-4 w-4 mr-1" />
                Viewing as Member: <strong>{target.memberName}</strong>
              </>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExit}
          className="gap-2 border-warning text-warning hover:bg-warning/20"
        >
          <LogOut className="h-4 w-4" />
          Exit View
        </Button>
      </div>
    </div>
  );
}

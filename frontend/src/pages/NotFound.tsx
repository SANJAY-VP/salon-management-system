import { Icon } from "../components/common/Icon";
import Button from "../components/common/Button";
import { useNavigate } from "react-router-dom";
import { PageLayoutDesktop, PageContainerDesktop } from "../components/common/Header";
import { EmptyState } from "../components/common/ReusableCards";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageLayoutDesktop showHeader={false} fullScreen>
      <PageContainerDesktop className="min-h-[100dvh] flex items-center justify-center">
        <EmptyState
          // icon={<Icon icon="times" />}
          title="404 - Page Not Found"
          description="The page you're looking for doesn't exist or has been moved."
          action={
            <Button variant="primary" onClick={() => navigate("/home")} className="px-8 py-3 !rounded-xl uppercase tracking-widest text-[10px] font-bold">
              Return Home
            </Button>
          }
        />
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}

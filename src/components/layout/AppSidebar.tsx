
import { 
  Sidebar, 
  SidebarContent, 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Upload, FilePlus, Settings, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppSidebarProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

export const AppSidebar = ({ activeSection, onNavigate }: AppSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const sidebarItems = [
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'files', title: 'Dateien & Konvertierung', icon: FilePlus },
    { id: 'settings', title: 'Einstellungen', icon: Settings },
    { id: 'printplate', title: 'Printplate-Erstellung', icon: Printer },
  ];

  // Logo components for different sidebar states
  const CompactLogo = () => (
    <div className="rounded-md bg-primary p-1 w-8 h-8 flex items-center justify-center mx-auto">
      <span className="text-sm font-bold text-primary-foreground">CP</span>
    </div>
  );
  
  const FullLogo = () => (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-primary p-1 w-8 h-8 flex items-center justify-center">
        <span className="text-sm font-bold text-primary-foreground">CP</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-primary">CutPilot</h3>
        <p className="text-xs text-muted-foreground">JPG zu PDF mit CutContour</p>
      </div>
    </div>
  );

  return (
    <Sidebar className="w-64" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          {/* Logo display based on sidebar state */}
          {isCollapsed ? <CompactLogo /> : <FullLogo />}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeSection === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Info</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2">
              <div className="mb-2 text-xs text-muted-foreground">
                <p>PDF-Converter Pro</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-primary h-1.5 rounded-full w-3/4"></div>
                </div>
              </div>
              <Button variant="outline" className="w-full text-xs" size="sm">
                <span>Upgrade auf Pro</span>
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {/* The dropdown menu has been removed from the footer */}
      </SidebarFooter>
    </Sidebar>
  );
};

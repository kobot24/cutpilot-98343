
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Printer, User, Settings, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import cutpilotLogo from "@/assets/cutpilot-logo.svg";

type AppSidebarProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

export const AppSidebar = ({ activeSection, onNavigate }: AppSidebarProps) => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const sidebarItems = [
    { id: 'upload', title: 'Upload & Konvertierung', icon: Upload },
    { id: 'printplate', title: 'Printplate-Erstellung', icon: Printer },
  ];

  // Logo components for different sidebar states
  const CompactLogo = () => (
    <div className="rounded-md bg-primary p-1 w-8 h-8 flex items-center justify-center mx-auto">
      <img src={cutpilotLogo} alt="CutPilot Logo" className="w-full h-full" />
    </div>
  );
  
  const FullLogo = () => (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-white p-1 w-8 h-8 flex items-center justify-center">
        <img src={cutpilotLogo} alt="CutPilot Logo" className="w-full h-full" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-primary">CutPilot</h3>
        <p className="text-xs text-muted-foreground">JPG zu PDF mit CutContour</p>
      </div>
    </div>
  );

  // Handle navigation for settings from dropdown
  const handleSettingsClick = () => {
    onNavigate('settings');
  };

  return (
    <Sidebar className="w-64" variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center">
        <div className="flex justify-between items-center w-full px-2">
          {/* Logo display based on sidebar state */}
          {isCollapsed ? <CompactLogo /> : <FullLogo />}
          <SidebarTrigger className="h-7 w-7" />
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
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">Benutzer</span>
                <span className="ml-auto flex h-4 w-4 items-center justify-center">
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-50"
                  >
                    <path 
                      d="M6 8.5L10 4.5L9.3 3.8L6 7.1L2.7 3.8L2 4.5L6 8.5Z" 
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Einstellungen</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

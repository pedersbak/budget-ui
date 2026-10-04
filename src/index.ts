import './styles.css';

// Hooks
export { useDebounce } from "./hooks/useDebounce";

// Network graph components
export { NetworkGraph } from "./components/NetworkGraph/NetworkGraph";
export { NetworkNode, NODE_SIZE } from "./components/NetworkNode/NetworkNode";
export { NetworkLink } from "./components/NetworkLink/NetworkLink";

// Auth form components
export { LoginForm } from "./components/LoginForm/LoginForm";
export { RegisterForm } from "./components/RegisterForm/RegisterForm";
export { RelationModal } from "./components/RelationModal/RelationModal";
export { NetworkIcon } from "./components/NetworkIcon/NetworkIcon";

// Utility / overlay components
export { ReportModal } from "./components/ReportModal/ReportModal";
export { AiReportButton } from "./components/AiReportButton/AiReportButton";

// Mobile-specific components
export { MobileCardView } from "./components/MobileCardView/MobileCardView";
export { MobileRadialView } from "./components/MobileRadialView/MobileRadialView";

// Network graph prop types
export type { NetworkGraphProps } from "./components/NetworkGraph/NetworkGraph";
export type { NetworkNodeProps } from "./components/NetworkNode/NetworkNode";
export type { NetworkLinkProps } from "./components/NetworkLink/NetworkLink";

// Auth form prop types
export type { LoginFormProps } from "./components/LoginForm/LoginForm";
export type { RegisterFormProps } from "./components/RegisterForm/RegisterForm";

// Utility / overlay prop types
export type { ReportModalProps } from "./components/ReportModal/ReportModal";
export type { AiReportButtonProps } from "./components/AiReportButton/AiReportButton";

// Mobile prop types
export type { MobileCardViewProps } from "./components/MobileCardView/MobileCardView";
export type { MobileRadialViewProps } from "./components/MobileRadialView/MobileRadialView";

// Network data types
export type { NetworkNodeData, NetworkLinkData, NodeType, RelationEntry } from "./types/network";

// Auth
export { AuthProvider, useAuth, createAuthService, decodeJwtUser } from "./auth/index";
export type {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  AuthUser,
  AuthContextValue,
  AuthProviderProps,
  AuthServiceConfig,
  AuthService,
} from "./auth/index";

// Product application template
export { TemplateProvider, useTemplate } from './template/context';
export { AppShell, PreferenceMenu } from './template/AppShell';
export { RouteGuard, demoAuthAdapter, assumeDemoRole } from './template/auth';
export {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  StatCard,
  Textarea,
  Tile,
} from './template/ui';
export { hasRole, ROLE_WEIGHT } from './template/types';
export { createHttpAuthAdapter } from './template/httpAuthAdapter';
export { getErrorMessage } from './template/errors';
export type {
  AppBrand,
  AuthAdapter,
  AuthSession,
  Credentials,
  Locale,
  NavItem,
  Registration,
  Role,
  ThemeId,
  User,
} from './template/types';
export type { TemplateProviderProps } from './template/context';
export type { AppShellProps } from './template/AppShell';
export type { HttpAuthAdapterConfig } from './template/httpAuthAdapter';
export type { BadgeVariant, ButtonProps, ButtonVariant } from './template/ui';

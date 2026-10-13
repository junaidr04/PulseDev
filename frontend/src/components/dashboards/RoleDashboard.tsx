import React from 'react';
import { getRoleTheme, resolveRoleKey } from '../../theme/roleTheme';
import AdminDashboard, { RoleCockpitProps } from './AdminDashboard';
import PriyaLeadDashboard from './PriyaLeadDashboard';
import DeveloperDashboard from './DeveloperDashboard';
import QADashboard from './QADashboard';
import PMDashboard from './PMDashboard';

export type RoleDashboardProps = Omit<RoleCockpitProps, 'theme'>;

/**
 * RoleDashboard Wrapper:
 * Dynamically selects the role-tailored cockpit strictly from `user?.role` (never from a hardcoded name).
 * - admin -> AdminDashboard ("Command Center", emerald #10B981)
 * - lead -> PriyaLeadDashboard ("Service Health & Review Hub", violet #A78BFA)
 * - developer -> DeveloperDashboard ("My Focus Mode", cyan #22D3EE)
 * - qa -> QADashboard ("Quality Gate Lab", amber #FBBF24)
 * - guest (PM) -> PMDashboard ("Roadmap & Delivery Studio", pink-coral #FB7185)
 */
export const RoleDashboard: React.FC<RoleDashboardProps> = (props) => {
  const roleKey = resolveRoleKey(props.user?.role);
  const theme = getRoleTheme(roleKey);

  const cockpitProps: RoleCockpitProps = {
    ...props,
    theme,
  };

  switch (roleKey) {
    case 'lead':
      return <PriyaLeadDashboard {...cockpitProps} />;
    case 'developer':
      return <DeveloperDashboard {...cockpitProps} />;
    case 'qa':
      return <QADashboard {...cockpitProps} />;
    case 'guest':
      return <PMDashboard {...cockpitProps} />;
    case 'admin':
    default:
      return <AdminDashboard {...cockpitProps} />;
  }
};

export default RoleDashboard;

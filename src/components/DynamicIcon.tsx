import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number | string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size = 20, ...props }) => {
  // @ts-ignore
  const IconComponent = Icons[name] || Icons.Folder;
  return <IconComponent className={className} size={size} {...props} />;
};

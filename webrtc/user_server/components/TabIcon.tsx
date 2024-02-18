import React from 'react';

import { IconType } from 'react-icons';
import { MdHome, MdSettings, MdAccountCircle } from 'react-icons/md';
import { FaRegHeart, FaRegCommentDots } from 'react-icons/fa';

interface IconProps {
  iconName: string;
  size?: number; // Optional size prop to customize icon size
}

const iconDictionary: Record<string, IconType> = {
    tab2: MdAccountCircle || MdHome,
    tab1: MdAccountCircle || MdSettings,
    tab3: FaRegCommentDots
  };

const IconComponent: React.FC<IconProps> = ({ iconName, size = 24 }) => {
  const Icon = iconDictionary[iconName];
  return <Icon size={size} />;
};

export default IconComponent;

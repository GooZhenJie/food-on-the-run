import React from 'react';
import { Divider } from 'antd';
import type { IAuthDividerProps } from './type';

export const AuthDivider: React.FC<IAuthDividerProps> = ({ text = '' }) => {
  return (
    <Divider
      plain
      className="!my-7 !text-gray-400 !text-[12px] !uppercase !tracking-wider"
    >
      {text}
    </Divider>
  );
};

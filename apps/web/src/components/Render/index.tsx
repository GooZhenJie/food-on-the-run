import React from 'react';
import { Service } from '@/components/Service';
import { componentMap } from './componentMap';
import { ComponentUpdating } from './components/ComponentUpdating';
import { fixturesRegistry } from './schemaComponents';
import { MockService } from './preview/MockService';
import { usePreview } from './preview/context';
import type { ISchemaNode } from './type';

interface IRenderProps {
  schema: ISchemaNode;
}

export const Render: React.FC<IRenderProps> = ({ schema }) => {
  const Component = componentMap[schema.name];
  const preview = usePreview();

  if (!Component) {
    return <ComponentUpdating name={schema.name} />;
  }

  const props = schema.props || {};
  const hasApi = typeof props.api === 'string';
  const interval =
    typeof props.interval === 'number' ? (props.interval as number) : undefined;

  const renderChildren = () =>
    schema.children?.map((child, i) => (
      <Render key={`${child.name}-${i}`} schema={child} />
    ));

  if (hasApi) {
    const fixtures = fixturesRegistry[schema.name];
    if (preview.enabled && fixtures) {
      return (
        <MockService
          fixtures={fixtures}
          preset={preview.preset}
          state={preview.dataState}
        >
          <Component {...props}>{renderChildren()}</Component>
        </MockService>
      );
    }

    return (
      <Service api={props.api as string} interval={interval}>
        <Component {...props}>{renderChildren()}</Component>
      </Service>
    );
  }

  return <Component {...props}>{renderChildren()}</Component>;
};

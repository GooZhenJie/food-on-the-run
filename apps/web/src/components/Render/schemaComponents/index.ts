import { HeroBanner } from './HeroBanner';
import { MenuGrid } from './MenuGrid';
import { ReviewList } from './ReviewList';
import { InfoCard } from './InfoCard';
import { PageWrapper } from './PageWrapper';
import { AuthPage } from './AuthPage';
import { AuthForm } from './AuthForm';
import { AuthDivider } from './AuthDivider';
import { OAuthSection } from './OAuthSection';

import { menuGridFixtures } from './MenuGrid/mock';
import { reviewListFixtures } from './ReviewList/mock';

import type { IComponentFixtures } from '../preview/fixtures';

export {
  HeroBanner,
  MenuGrid,
  ReviewList,
  InfoCard,
  PageWrapper,
  AuthPage,
  AuthForm,
  AuthDivider,
  OAuthSection,
};

/**
 * Fixtures registry keyed by schema component `name`.
 * Only components that consume Service data are registered here; pure display
 * components (HeroBanner / InfoCard / PageWrapper / AuthPage / AuthForm /
 * AuthDivider / OAuthSection) render from props and need no fixtures.
 */
export const fixturesRegistry: Record<
  string,
  IComponentFixtures<unknown> | undefined
> = {
  MenuGrid: menuGridFixtures as IComponentFixtures<unknown>,
  ReviewList: reviewListFixtures as IComponentFixtures<unknown>,
};

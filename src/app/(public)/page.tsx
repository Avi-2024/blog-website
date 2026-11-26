import {homepageMetadata} from '@/lib/seo';
import {LatestFeed} from '@/components/LatestFeed';
import {LegacyQueryRedirect} from '@/components/LegacyQueryRedirect';

export const revalidate=300;
export const generateMetadata=homepageMetadata;
export default function Home(){
  return <><LegacyQueryRedirect/><LatestFeed/></>;
}

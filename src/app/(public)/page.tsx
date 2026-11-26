import {homepageMetadata} from '@/lib/seo';
import {LatestFeed} from '@/components/LatestFeed';

export const revalidate=300;
export const generateMetadata=homepageMetadata;
export default function Home(){
  return <LatestFeed/>;
}

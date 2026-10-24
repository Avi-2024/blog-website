import {getAllPosts} from './content';
import {cmsSettings} from './cms-settings';
import {cache} from 'react';
export const widgetPosts=cache(async()=>{
 const [posts,settings]=await Promise.all([getAllPosts(),cmsSettings()]);
 const selected=(ids:number[])=>ids.flatMap(id=>posts.filter(p=>p.id===id));
 // An empty selection falls back to recent published articles.
 return settings?{popular:settings.widgets.popular.length?selected(settings.widgets.popular):posts.slice(0,4),mustRead:posts.find(p=>p.id===settings.widgets.mustRead)||posts[4],missed:settings.widgets.showMissed?selected(settings.widgets.missed):[]}:{popular:posts.slice(0,4),mustRead:posts[4],missed:[]};
});

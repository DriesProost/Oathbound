import {useRef, type TouchEvent} from 'react';
type Stroke = {x:number; y:number; time:number; cancelled:boolean};
export function swipeDirection(dx:number,dy:number,duration:number): -1 | 0 | 1 {
  if (duration > 900 || duration < 0 || Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.7) return 0;
  return dx < 0 ? 1 : -1;
}
export function useJournalSwipe(turn:(direction:-1|1)=>void) {
  const stroke=useRef<Stroke|null>(null);
  return {
    onTouchStart(e:TouchEvent<HTMLElement>) {
      stroke.current=null;
      if(e.touches.length!==1 || !(e.target instanceof Element) ||
        e.target.closest('form,label,input,textarea,select,button,a,summary,[contenteditable],[data-no-page-swipe],[role="slider"]') ||
        document.activeElement?.matches('input,textarea,select,[contenteditable]') || window.getSelection()?.toString()) return;
      const t=e.touches[0];
      if(t.clientX<24 || t.clientX>window.innerWidth-24) return;
      stroke.current={x:t.clientX,y:t.clientY,time:performance.now(),cancelled:false};
    },
    onTouchMove(e:TouchEvent<HTMLElement>) {
      const s=stroke.current;if(!s)return;
      if(e.touches.length!==1){s.cancelled=true;return;}
      const t=e.touches[0], dx=Math.abs(t.clientX-s.x),dy=Math.abs(t.clientY-s.y);
      if(dy>24 && dy>dx)s.cancelled=true;
    },
    onTouchEnd(e:TouchEvent<HTMLElement>) {
      const s=stroke.current;stroke.current=null;
      if(!s || s.cancelled || e.changedTouches.length!==1 || window.getSelection()?.toString())return;
      const t=e.changedTouches[0],direction=swipeDirection(t.clientX-s.x,t.clientY-s.y,performance.now()-s.time);
      if(direction)turn(direction);
    },
    onTouchCancel(){stroke.current=null;},
  };
}

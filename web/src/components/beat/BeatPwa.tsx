'use client';
import {useEffect} from 'react';

export function BeatPwa(){
  useEffect(()=>{
    if(!window.isSecureContext || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/beat-sw.js',{scope:'/beat'}).catch(error=>{
      console.warn('Beat PWA registration unavailable',error);
    });
  },[]);
  return null;
}

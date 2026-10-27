import type {SVGProps} from "react";
const paths={
 home:"M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
 truck:"M3 5h11v12H3z M14 9h4l3 4v4h-7 M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
 chart:"M4 3v17h17 M8 15v-4 M13 15V7 M18 15v-7",
 orders:"M8 4H5v17h14V4h-3 M9 3h6v4H9z M8 12h8 M8 16h5",
 box:"m3 7 9-4 9 4-9 4Z M3 7v10l9 4 9-4V7 M12 11v10 M7 5l10 4",
 layers:"m3 7 9-4 9 4-9 4Z M3 12l9 4 9-4 M3 17l9 4 9-4",
 users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87",
 bag:"M5 7h14l2 14H3Z M8 8V6a4 4 0 0 1 8 0v2",
 ruler:"m3 16 13-13 5 5L8 21Z M12 7l3 3 M8 11l3 3 M5 14l3 3",
 history:"M3 3v5h5 M3 8a9 9 0 1 1-1 8 M12 7v5l3 2",
 file:"M14 2H5v20h14V7Z M14 2v6h5 M8 12h8 M8 16h6",
 menu:"M4 6h16 M4 12h16 M4 18h16",
 close:"m6 6 12 12 M6 18 18 6",
 arrow:"M4 12h16 M14 6l6 6-6 6",
 back:"M20 12H4 M10 6l-6 6 6 6",
 plus:"M12 4v16 M4 12h16",
 check:"m5 12 4 4L19 6",
 alert:"m12 3 10 18H2Z M12 9v5 M12 17v1",
 logout:"M9 3H4v18h5 M9 12h12 M16 7l5 5-5 5",
 chevron:"m9 6 6 6-6 6",
 panel:"M3 4h18v16H3Z M9 4v16",
} as const;
export type IconName=keyof typeof paths;
export function Icon({name,className="size-5",...props}:SVGProps<SVGSVGElement>&{name:IconName}) {
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false" {...props}><path d={paths[name]}/></svg>;
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Dev-only "uhmm-acktually" button. Surfaces the plain-text logs written by the
// /uhmm-acktually skill (uhmm-acktually-logs/) so you can glance at the rolling
// recap and what we did this session without leaving the live (dev) site.
// Rendered only when NODE_ENV === "development" — see layout.tsx.
//
// Portable: depends only on react + framer-motion and stock Tailwind classes.
// Drop into any Next.js App Router project alongside /api/uhmm-acktually.

type Entry = { name: string; content: string } | null;
type LogData = { summary: string; current: Entry; previous: Entry };

const spring = { type: "spring" as const, stiffness: 420, damping: 34 };

// Pretty filename: "SESSION-2026-06-21-1432.md" -> "2026-06-21 14:32"
function sessionLabel(name: string): string {
  const m = name.match(/SESSION-(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})/);
  return m ? `${m[1]} ${m[2]}:${m[3]}` : name;
}

export default function UhmmAcktually() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"recap" | "current">("recap");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/uhmm-acktually", { cache: "no-store" });
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    load(); // refresh on every open so logs stay live
  }

  const current = data?.current;
  const hasRecap = !!data?.summary?.trim();

  return (
    <motion.div
      layout
      data-dev-overlay
      transition={spring}
      style={{ borderRadius: open ? 16 : 100 }}
      className={`fixed bottom-[176px] right-5 overflow-hidden border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
        open ? "z-[70] w-[340px]" : "z-[60] h-11 w-11 cursor-pointer"
      }`}
      onClick={open ? undefined : handleOpen}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex flex-col gap-3 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainIcon className="text-neutral-900" size={16} />
                <p className="text-sm font-sans font-medium text-neutral-900">
                  uhmm-acktually
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors duration-150 ease-out hover:bg-neutral-100 active:bg-neutral-200"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
              {(["recap", "current"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md py-1 font-sans text-[14px] leading-[18px] font-medium capitalize transition-colors duration-150 ease-out ${
                    tab === t
                      ? "bg-white text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {t === "current" ? "This session" : "Recap"}
                </button>
              ))}
            </div>

            <div className="max-h-[48vh] overflow-y-auto">
              {loading && (
                <p className="font-sans text-xs text-neutral-400">Loading…</p>
              )}

              {!loading && tab === "recap" && (
                hasRecap ? (
                  <pre className="whitespace-pre-wrap break-words font-sans text-[16px] leading-[22px] text-neutral-700">
                    {data!.summary.trim()}
                  </pre>
                ) : (
                  <EmptyState />
                )
              )}

              {!loading && tab === "current" && (
                current?.content?.trim() ? (
                  <div className="flex flex-col gap-2">
                    <p className="font-sans text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                      {sessionLabel(current.name)}
                    </p>
                    <pre className="whitespace-pre-wrap break-words font-sans text-[16px] leading-[22px] text-neutral-700">
                      {current.content.trim()}
                    </pre>
                  </div>
                ) : (
                  <EmptyState />
                )
              )}
            </div>

            <button
              onClick={() => load()}
              className="rounded-lg border border-black/[0.08] py-1.5 font-sans text-[14px] leading-[18px] font-medium text-neutral-600 transition-colors duration-150 ease-out hover:bg-neutral-100 active:bg-neutral-200"
            >
              Refresh
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex h-11 w-11 items-center justify-center text-neutral-900"
          >
            <BrainIcon size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <p className="font-sans text-xs leading-relaxed text-neutral-400">
      uhmm acktually youve done nothing yet hehe. Run <span className="font-mono text-neutral-600">/uhmm-acktually</span> in
      Claude Code to capture what we did.
    </p>
  );
}

function BrainIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size * 0.92}
      height={size}
      viewBox="0 0 92 100"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M41.7393 0H49.2682C50.007 0.268082 51.3707 0.375999 52.1919 0.490567C53.1894 0.6273 54.1811 0.80434 55.1643 1.02126C57.9893 1.62174 68.2983 4.85775 69.4992 7.33067C69.7013 7.7468 69.7511 8.20538 69.5879 8.64308C69.404 9.13585 68.9037 9.67327 68.4193 9.88369C67.8655 10.1242 67.1795 9.8999 66.6578 9.67469C65.718 9.26886 64.8292 8.67298 63.92 8.19696C62.7674 7.59349 61.5201 7.09095 60.3023 6.63272C50.7178 3.03688 40.1508 3.06026 30.5823 6.69849C20.3722 10.6297 12.1201 18.422 7.61033 28.3899C7.23347 29.2564 6.8656 30.1269 6.50662 31.0009L11.4101 31.0085C12.0635 28.7926 13.291 27.1134 15.3432 26.0203C16.1279 25.6023 17.4573 25.2547 18.3271 25.218C20.8202 25.1196 23.3316 25.1543 25.829 25.1576C29.0477 25.1618 32.2721 25.1274 35.4894 25.1955C37.9983 25.2486 39.8488 26.3989 41.4836 28.2012C44.4659 26.3101 46.6701 26.4524 49.6624 28.24C50.5786 26.7874 52.2243 25.7769 53.8843 25.3996C55.5133 25.0295 71.2154 25.0006 73.1942 25.285C74.3918 25.457 75.3281 25.805 76.3487 26.4585C78.0066 27.5201 79.04 29.0879 79.6125 30.9496C81.2424 31.0094 82.9482 30.9561 84.5251 31.0318C83.5852 28.6538 82.5579 26.3239 81.2238 24.1356C80.5079 22.9614 79.4003 21.7724 78.8801 20.5203C78.6911 20.0656 78.6794 19.5012 78.8774 19.0478C79.0865 18.5688 79.4707 18.0414 79.9816 17.8612C80.4275 17.704 80.9125 17.8027 81.3273 18.0041C83.8627 19.2353 87.8391 28.4547 88.7541 31.2292C92.5242 42.6978 91.5892 55.1936 86.1546 65.9734C81.52 75.1565 74.3043 82.071 65.1295 86.6408C64.7167 90.936 66.2737 95.8179 62.7107 98.624C61.4369 99.6279 60.8696 99.4805 60.0713 100H57.6213C54.1964 98.5449 51.3869 96.5267 48.1178 94.862C45.9115 95.3682 45.0866 95.3598 42.8867 94.8498C40.5684 95.9695 37.8794 97.8057 35.5634 99.0459C34.8598 99.4229 34.1408 99.623 33.4761 99.9707L33.4205 100H30.9459C29.8725 99.3555 29.3185 99.5449 28.0945 98.4385C25.846 96.4047 25.967 94.5405 25.971 91.731C25.9733 90.1496 26.0392 88.185 25.9288 86.6646C25.3858 86.3288 24.4685 85.8902 23.8704 85.5638C13.1951 79.7853 5.26624 69.9866 1.84194 58.3407C-1.5499 46.77 -0.222211 34.327 5.53464 23.7324C11.3343 13.0556 21.1695 5.14715 32.8424 1.77463C35.0161 1.13793 37.2261 0.683115 39.4715 0.396586C40.1309 0.312438 41.0408 0.215047 41.6491 0.0285237L41.7393 0ZM11.1645 34.9935C9.97302 35.0283 6.41599 35.0946 5.34324 34.9681C4.76622 36.6148 4.38276 39.0564 4.18953 40.821C3.29533 48.5909 4.62216 56.4553 8.01609 63.5018C11.7009 71.1493 18.378 78.5011 26.0498 82.2649C26.5082 80.4446 27.3201 79.024 28.9735 78.0298C30.3799 77.1855 32.0663 76.9416 33.6542 77.3527C35.5219 77.833 40.8296 81.2259 42.9639 82.3323C44.2181 82.0261 44.8212 81.8918 46.1124 81.9211C46.7916 82.0312 47.4677 82.1587 48.1403 82.3034L52.634 79.7179C55.1304 78.277 57.4695 76.5301 60.4692 77.3766C62.2818 77.8881 63.4769 78.959 64.4237 80.5732C64.7241 81.0854 64.7899 81.7326 65.074 82.0198C65.6391 82.1245 68.2526 80.3479 68.8769 79.9189C78.0928 73.6535 84.4164 63.9592 86.4363 52.9999C87.4665 47.4167 87.341 40.496 85.7777 35.009C84.322 35.0074 81.1942 35.0943 79.9202 34.9562C79.8483 36.127 79.8682 37.3166 79.8711 38.4903C79.8801 42.1864 80.3344 45.8287 77.2028 48.4865C75.6312 49.8204 74.0149 50.4279 71.9355 50.4395C66.5056 50.4396 61.0859 50.4931 55.6591 50.4233C53.5216 50.3932 51.2996 49.4032 49.8989 47.7877C47.7964 45.3685 47.9861 42.9932 47.9961 40.0133L48.0127 35.3403C48.0202 32.8256 48.1316 30.4919 44.7261 30.885C42.6647 31.884 43 33.6256 43.0094 35.6119L43.0333 40.2333C43.0446 42.5889 43.1787 44.4229 41.9962 46.5258C39.4506 51.0527 34.6152 50.559 30.1162 50.4552C26.4177 50.3698 22.0968 50.6981 18.423 50.3995C17.7126 50.3481 17.0115 50.2063 16.337 49.9774C14.4219 49.3135 12.8497 47.9147 11.9674 46.0899C10.7034 43.4603 11.2606 38.1615 11.1645 34.9935ZM72.8237 46.4296C75.6774 45.5695 76.0182 43.776 75.9675 41.1121C75.9445 38.432 76.0086 35.6835 75.931 33.0134C75.8782 31.1956 74.6011 29.2032 72.6558 29.22C66.8898 29.2696 60.7609 28.925 55.0238 29.2349C50.7917 29.8329 52.0212 35.7245 51.8927 38.7911C51.5912 45.9864 52.5075 46.5085 59.1787 46.5111L69.9424 46.505C70.6916 46.5037 72.1115 46.5315 72.8237 46.4296ZM45.5094 85.8405C44.0013 85.8605 42.7939 87.0972 42.8102 88.6053C42.8265 90.1134 44.0604 91.3237 45.5685 91.3109C47.0817 91.2981 48.2969 90.0593 48.2806 88.5461C48.2642 87.033 47.0225 85.8207 45.5094 85.8405ZM51.2919 85.0421C52.4764 87.7001 52.5832 89.4697 51.2452 92.1049C52.6164 92.862 53.9779 93.6365 55.3294 94.4283C56.8182 95.3126 59.4526 97.2311 60.7613 94.9837C60.9477 94.6697 61.0662 94.3199 61.1088 93.9572C61.2935 92.3598 61.2996 83.7812 60.9239 82.4556C60.7994 82.0165 60.4956 81.6658 60.0958 81.4496C59.4974 81.126 58.8865 81.1189 58.2259 81.1701C57.4671 81.4274 56.2468 82.1747 55.5174 82.5962L51.2919 85.0421ZM35.9854 46.4303C37.132 46.0944 38.0295 45.6066 38.6157 44.5073C38.866 44.0378 39.0077 43.5227 39.0666 42.9953C39.2178 41.6433 39.2171 32.7888 38.8885 31.7206C38.5889 30.7468 37.9695 29.9986 37.0609 29.5344C36.6147 29.3063 36.1587 29.2496 35.665 29.2115C33.2084 29.0219 30.6562 29.1624 28.1899 29.1634C24.8261 29.1647 21.4246 29.0633 18.0657 29.2396C16.4777 29.5452 15.2169 30.9168 15.1676 32.5626C15.0593 36.1761 14.9601 39.9688 15.2148 43.5776C15.2744 44.4221 16.2764 45.6086 17.0028 46.0055C18.5256 46.7003 20.9036 46.5108 22.5408 46.5112L28.8046 46.5096C30.191 46.5087 34.9043 46.5877 35.9854 46.4303ZM39.7924 92.0889C38.5872 89.5546 38.5738 87.6413 39.7923 85.0978C37.815 83.8687 34.8776 82.09 32.7127 81.2103C32.43 81.0953 31.845 81.1449 31.5342 81.1728C31.1502 81.3293 30.4488 81.689 30.2803 82.114C29.494 84.1854 30.0123 86.8385 29.8988 89.0696C29.8271 90.4798 29.8791 92.131 29.9006 93.5512C29.9337 95.7469 31.6925 96.6202 33.5858 95.6077C34.5966 95.0672 35.6299 94.451 36.647 93.8469C37.6839 93.2659 38.7485 92.6502 39.7924 92.0889Z" />
      <path d="M26.0661 56.1761C27.5744 56.0173 28.8376 57.1288 30.1595 57.774C31.497 58.427 32.7805 59.0486 34.1852 59.5545C41.7829 62.2281 50.0833 62.1162 57.6061 59.2388C58.6768 58.8202 59.6957 58.3613 60.7308 57.8623C61.9395 57.2797 63.7039 55.7159 65.1068 56.2566C65.5685 56.4368 65.9388 56.7946 66.1349 57.2497C66.8722 58.93 65.2104 59.888 63.9885 60.5734C62.5717 61.3681 61.1427 62.0263 59.6536 62.6686C58.866 62.979 58.0604 63.2784 57.2685 63.5812C56.7768 66.139 57.9223 70.0175 56.2056 72.0186C55.8999 72.375 55.0443 73.0646 54.5859 73.1473C51.8341 73.6435 48.3914 73.3516 45.5719 73.1835C44.8294 73.1392 43.8407 73.3538 43.0787 73.3498C40.9889 73.3292 38.7221 73.5826 36.6707 73.2088C35.5676 73.0077 34.2044 71.6902 34.0331 70.5511C33.6907 68.2744 33.9497 65.9154 33.8405 63.5946C32.349 63.0547 30.4609 62.3682 29.0713 61.6343C27.5156 60.8126 23.9388 59.5467 24.8795 57.2927C25.1394 56.6698 25.463 56.4455 26.0661 56.1761ZM43.5448 69.3907C43.5626 68.0677 43.5718 66.7447 43.5725 65.4215C42.4308 65.3386 38.7831 64.9267 37.8113 64.6199L37.7691 69.3783C39.6966 69.3577 41.5976 69.4204 43.5448 69.3907ZM47.5082 65.3635C47.4877 66.1029 47.3435 68.682 47.5867 69.2643C47.8285 69.4029 47.7179 69.3722 48.0349 69.3432C49.7669 69.4225 51.5011 69.4404 53.2344 69.3968C53.2521 68.5323 53.3943 65.4295 53.139 64.8313C52.8923 64.718 53.0014 64.7331 52.724 64.7843C51.3811 64.9683 48.7858 65.4114 47.5082 65.3635Z" />
      <path d="M74.2322 11.3805C75.2687 11.089 76.3443 11.6972 76.6288 12.7358C76.9132 13.7742 76.2976 14.8456 75.2571 15.123C74.2268 15.3976 73.1679 14.7892 72.8862 13.7607C72.6046 12.7322 73.2057 11.6692 74.2322 11.3805Z" />
    </svg>
  );
}

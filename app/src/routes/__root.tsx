import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Actions, type Porto } from 'porto/remote'
import * as React from 'react'

import LucideGlobe from '~icons/lucide/globe'
import LucideX from '~icons/lucide/x'
import { type appStore, useAppStore } from '../lib/app'
import { porto } from '../lib/porto'

export const Route = createRootRouteWithContext<{
  appState: appStore.State
  portoState: Porto.State
}>()({
  component: RouteComponent,
})

function RouteComponent() {
  const mode = useAppStore((state) => state.mode)
  const hostname = useAppStore((state) => state.referrer?.hostname)

  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const titlebarRef = React.useRef<HTMLDivElement | null>(null)
  React.useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { height, width } = entry.contentRect
          const titlebarHeight = titlebarRef.current?.clientHeight ?? 0
          if (mode === 'popup') {
            const topbarHeight = 30
            window.resizeTo(width, height + titlebarHeight + topbarHeight)
          } else if (mode === 'iframe')
            porto.messenger.send('__internal', {
              type: 'resize',
              height: height + titlebarHeight + 2,
              width: width + 2,
            })
        }
      })
    })

    resizeObserver.observe(element)
    return () => {
      resizeObserver.unobserve(element)
    }
  }, [mode])

  return (
    <>
      <header
        ref={titlebarRef}
        {...{ [`data-${mode}`]: '' }}
        className="fixed flex h-navbar w-full items-center justify-between border border-gray4 bg-gray2 px-3 pt-2 pb-1.5 data-iframe:rounded-t-[14px]"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-[5px] bg-gray6">
            <LucideGlobe className="size-3.5 text-black dark:text-white" />
          </div>
          <div className="font-normal text-[14px] text-gray9 leading-[22px]">
            {hostname}
          </div>
        </div>

        <button
          type="button"
          onClick={() => Actions.rejectAll(porto)}
          title="Close Dialog"
        >
          <LucideX className="size-4.5 text-gray9" />
        </button>
      </header>

      <div
        ref={contentRef}
        {...{ [`data-${mode}`]: '' }} // for conditional styling based on dialog mode ("in-data-iframe:..." or "in-data-popup:...")
        className="flex min-w-dialog flex-col overflow-hidden border-gray4 bg-gray1 pt-titlebar data-popup-standalone:min-h-dvh data-iframe:max-w-dialog data-iframe:rounded-[14px] data-iframe:border [:not(data-popup-standalone)]:h-fit"
      >
        <Outlet />
      </div>

      <React.Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </React.Suspense>
    </>
  )
}

const TanStackRouterDevtools =
  import.meta.env.PROD || window !== window.parent || Boolean(window.opener)
    ? () => null
    : React.lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      )

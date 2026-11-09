'use client'

import React, { type FC } from 'react'
import { useMedia } from 'react-use'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

type ResponsiveModalProps = {
  children: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  trigger: React.ReactNode
  close?: React.ReactNode
}

const ResponsiveModal: FC<ResponsiveModalProps> = ({
  children,
  close,
  trigger,
  description,
  title,
}) => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMedia('(min-width: 768px)', false)

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-h-[calc(100dvh-2rem)]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-4">{children}</div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>{close}</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ResponsiveModal

'use client'

import React, { ReactNode } from 'react'

// Import the modal to initialize it
import '../config/appKit'

interface AppKitProviderProps {
  children: ReactNode
}

export default function AppKitProvider({ children }: AppKitProviderProps) {
  return <>{children}</>
}
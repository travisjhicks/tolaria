import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type MobileEditorCommands = {
  pastePlainText?: () => void
  save?: () => void
}

export type RegisterMobileEditorCommands = (commands: MobileEditorCommands) => () => void

const emptyEditorCommands: MobileEditorCommands = {}

export function useMobileEditorCommandRegistry() {
  const nextTokenRef = useRef(1)
  const [registration, setRegistration] = useState({
    commands: emptyEditorCommands,
    token: 0,
  })

  const register = useCallback<RegisterMobileEditorCommands>((commands) => {
    const token = nextTokenRef.current
    nextTokenRef.current += 1
    setRegistration({ commands, token })

    return () => {
      setRegistration((current) => current.token === token
        ? { commands: emptyEditorCommands, token: 0 }
        : current)
    }
  }, [])

  return useMemo(() => ({
    commands: registration.commands,
    register,
  }), [register, registration.commands])
}

export function useRegisteredMobileEditorCommands(
  register: RegisterMobileEditorCommands | undefined,
  commands: MobileEditorCommands,
) {
  const commandsRef = useRef(commands)
  useEffect(() => {
    commandsRef.current = commands
  }, [commands])

  const registeredCommands = useMemo<MobileEditorCommands>(() => ({
    pastePlainText: () => {
      commandsRef.current.pastePlainText?.()
    },
    save: () => {
      commandsRef.current.save?.()
    },
  }), [])

  useEffect(() => {
    if (!register) return undefined
    return register(registeredCommands)
  }, [register, registeredCommands])
}

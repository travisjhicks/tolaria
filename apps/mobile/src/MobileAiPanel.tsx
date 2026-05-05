import { CaretLeft, PaperPlaneTilt } from 'phosphor-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import type { MobileNote } from './mobileNoteProjection'
import { sendMobileAiRequest } from './mobileAiClient'
import { styles } from './styles'
import { colors } from './theme'

export function MobileAiPanel({
  note,
  onClose,
}: {
  note: MobileNote
  onClose?: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [failed, setFailed] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')

  const canSend = apiKey.trim().length > 0 && baseUrl.trim().length > 0 && model.trim().length > 0 && prompt.trim().length > 0
  const sendPrompt = () => {
    setFailed(false)
    setIsSending(true)
    void sendMobileAiRequest({ apiKey, baseUrl, model, note, prompt })
      .then(setResponse)
      .catch(() => setFailed(true))
      .finally(() => setIsSending(false))
  }

  return (
    <View style={styles.properties}>
      <AiToolbar onClose={onClose} />
      <ScrollView contentContainerStyle={styles.aiContent}>
        <Text style={styles.propertyGroupTitle}>Model</Text>
        <AiModelFields
          apiKey={apiKey}
          baseUrl={baseUrl}
          model={model}
          onChangeApiKey={setApiKey}
          onChangeBaseUrl={setBaseUrl}
          onChangeModel={setModel}
        />
        <AiPromptComposer
          canSend={canSend}
          isSending={isSending}
          note={note}
          onChangePrompt={setPrompt}
          onSend={sendPrompt}
          prompt={prompt}
        />
        <AiResult failed={failed} response={response} />
      </ScrollView>
    </View>
  )
}

function AiToolbar({ onClose }: { onClose?: () => void }) {
  return (
    <View style={styles.toolbar}>
      <Text style={styles.propertiesTitle}>AI</Text>
      <View style={styles.toolbarSpacer} />
      {onClose ? (
        <Pressable onPress={onClose} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
          <CaretLeft size={23} color={colors.textSoft} />
        </Pressable>
      ) : null}
    </View>
  )
}

function AiModelFields({
  apiKey,
  baseUrl,
  model,
  onChangeApiKey,
  onChangeBaseUrl,
  onChangeModel,
}: {
  apiKey: string
  baseUrl: string
  model: string
  onChangeApiKey: (value: string) => void
  onChangeBaseUrl: (value: string) => void
  onChangeModel: (value: string) => void
}) {
  return (
    <>
      <AiInput onChangeText={onChangeBaseUrl} placeholder="Base URL" value={baseUrl} />
      <AiInput onChangeText={onChangeModel} placeholder="Model" value={model} />
      <AiInput onChangeText={onChangeApiKey} placeholder="API key" secureTextEntry value={apiKey} />
    </>
  )
}

function AiPromptComposer({
  canSend,
  isSending,
  note,
  onChangePrompt,
  onSend,
  prompt,
}: {
  canSend: boolean
  isSending: boolean
  note: MobileNote
  onChangePrompt: (value: string) => void
  onSend: () => void
  prompt: string
}) {
  return (
    <>
      <Text style={styles.propertyGroupTitle}>Prompt</Text>
      <TextInput
        multiline
        onChangeText={onChangePrompt}
        placeholder={`Ask about ${note.title}`}
        placeholderTextColor={colors.mutedText}
        style={styles.aiPrompt}
        textAlignVertical="top"
        value={prompt}
      />
      <AiSendButton canSend={canSend} isSending={isSending} onSend={onSend} />
    </>
  )
}

function AiInput({
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: {
  onChangeText: (value: string) => void
  placeholder: string
  secureTextEntry?: boolean
  value: string
}) {
  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedText}
      secureTextEntry={secureTextEntry}
      style={styles.aiInput}
      value={value}
    />
  )
}

function AiSendButton({
  canSend,
  isSending,
  onSend,
}: {
  canSend: boolean
  isSending: boolean
  onSend: () => void
}) {
  return (
    <Pressable
      disabled={!canSend || isSending}
      onPress={onSend}
      style={({ pressed }) => [
        styles.aiSendButton,
        !canSend || isSending ? styles.composeButtonDisabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <PaperPlaneTilt color="#ffffff" size={18} weight="fill" />
      <Text style={styles.aiSendButtonText}>{isSending ? 'Sending' : 'Send'}</Text>
    </Pressable>
  )
}

function AiResult({
  failed,
  response,
}: {
  failed: boolean
  response: string
}) {
  return (
    <>
      {failed ? <Text style={styles.propertyError}>AI request failed.</Text> : null}
      {response ? <Text style={styles.aiResponse}>{response}</Text> : null}
    </>
  )
}

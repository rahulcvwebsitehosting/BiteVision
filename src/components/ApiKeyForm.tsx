import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ChoiceList } from '@/components/Choice';
import { looksLikeApiKey, setApiKey, type Provider } from '@/api/keyStore';
import { PROVIDERS, providerConfig } from '@/api/providers';
import { VisionError, verifyApiKey } from '@/api/vision';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Body, Caption } from '@/components/Type';
import { color, opacity, space } from '@/constants/theme';

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'passed' }
  | { status: 'failed'; message: string };

interface Props {
  /** Called once a key has been stored, whether or not it was tested. */
  onSaved: () => void;
  saveLabel?: string;
}

/**
 * Key entry, shared by onboarding and Settings. The key goes straight to
 * `keyStore` and is never lifted into component state beyond this form.
 *
 * The provider is chosen here too — two of the providers (Mistral, Zen) have
 * keys with no recognisable prefix, so the provider cannot be recovered from
 * the key alone and must be stored alongside it.
 */
export function ApiKeyForm({ onSaved, saveLabel = 'Save key' }: Props) {
  const [provider, setProvider] = useState<Provider>('gemini');
  const [value, setValue] = useState('');
  const [test, setTest] = useState<TestState>({ status: 'idle' });
  const [helpOpen, setHelpOpen] = useState(false);

  const config = providerConfig(provider);
  const shaped = looksLikeApiKey(value, provider);

  const runTest = async () => {
    setTest({ status: 'testing' });
    try {
      await setApiKey(value, provider);
      await verifyApiKey();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTest({ status: 'passed' });
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Surface the underlying cause instead of one blanket message — the kind
      // and the raw error tell network apart from timeout apart from a bad key.
      const kind = error instanceof VisionError ? error.kind : 'unknown';
      const detail =
        error instanceof Error ? error.message : String(error);
      setTest({
        status: 'failed',
        message:
          kind === 'unauthorized'
            ? 'That key was rejected. Check you copied all of it.'
            : kind === 'billing'
              ? `${config.label} accepted the key, but the account has no credits. Add credits with your provider, then try again.`
              : `Test failed — kind: ${kind}. ${detail}`,
      });
    }
  };

  const save = async () => {
    await setApiKey(value, provider);
    onSaved();
  };

  return (
    <View style={styles.root}>
      <ChoiceList
        options={PROVIDERS.map((p) => ({
          value: p.id,
          label: p.free ? `${p.label} · Free` : p.label,
          detail: p.note,
        }))}
        value={provider}
        onChange={(next) => {
          setProvider(next);
          setValue('');
          setTest({ status: 'idle' });
        }}
      />

      <Field
        value={value}
        onChangeText={(next) => {
          setValue(next);
          setTest({ status: 'idle' });
        }}
        label={`${config.label} API key`}
        placeholder={placeholderFor(provider)}
        secureTextEntry
        autoFocus
        hint={
          shaped || value.length === 0
            ? `${config.note ?? 'Stored in this phone’s keychain; it never leaves the device except to call that provider.'}`
            : undefined
        }
        error={
          value.length > 0 && !shaped
            ? `That doesn’t look like a ${config.label} key.`
            : undefined
        }
      />

      <Pressable
        onPress={() => setHelpOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel="Where do I get this?"
        accessibilityState={{ expanded: helpOpen }}
        style={({ pressed }) => [
          styles.help,
          pressed && { opacity: opacity.pressed },
        ]}
      >
        <Body>Where do I get this?</Body>
        <Feather
          name={helpOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={color.muted}
        />
      </Pressable>

      {helpOpen ? (
        <View style={styles.helpBody}>
          <Body muted>
            Snap calls {config.label} directly from your phone with your own key
            — no server in between. Create one, copy it once, and paste it here.
          </Body>
          <Button
            label={`${config.label} console`}
            variant="secondary"
            onPress={() => void Linking.openURL(config.keyUrl)}
          />
        </View>
      ) : null}

      {test.status === 'passed' ? (
        <Caption style={styles.passed}>Key works.</Caption>
      ) : test.status === 'failed' ? (
        <Caption style={styles.failed}>{test.message}</Caption>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Test key"
          variant="secondary"
          onPress={() => void runTest()}
          disabled={!shaped}
          loading={test.status === 'testing'}
        />
        <Button
          label={saveLabel}
          onPress={() => void save()}
          disabled={!shaped || test.status === 'testing'}
        />
      </View>
    </View>
  );
}

function placeholderFor(provider: Provider): string {
  switch (provider) {
    case 'anthropic':
      return 'sk-ant-…';
    case 'gemini':
      return 'AIza…';
    case 'nvidia':
      return 'nvapi-…';
    case 'mistral':
      return 'your Mistral key';
    case 'zen':
      return 'your Zen key';
  }
}

const styles = StyleSheet.create({
  root: { gap: space.base },
  help: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpBody: { gap: space.md },
  actions: { gap: space.sm },
  passed: { color: color.olive },
  failed: { color: color.paprika },
});

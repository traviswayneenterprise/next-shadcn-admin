import { useEffect, useState } from "react";

import { COMMAND_PRIORITY_LOW } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { Mic, MicOff } from "lucide-react";

import {
  SPEECH_TO_TEXT_COMMAND,
  SUPPORT_SPEECH_RECOGNITION,
} from "@/components/editor/extensions/speech-to-text";
import { useTranslation } from "@/components/editor/plugins/i18n-plugin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SpeechToTextButton() {
  const [editor] = useLexicalComposerContext();
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      SPEECH_TO_TEXT_COMMAND,
      (enabled) => {
        setIsListening(enabled);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={cn(
        "text-muted-foreground",
        isListening && "text-destructive hover:text-destructive",
      )}
      title={t.speechToText}
      aria-label={t.speechToText}
      aria-pressed={isListening}
      onClick={() =>
        editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isListening)
      }
    >
      <Mic />
    </Button>
  );
}

export function SpeechToTextPlugin() {
  const { t } = useTranslation();
  // SUPPORT_SPEECH_RECOGNITION is computed from `typeof window`, so it's
  // always false during SSR but can be true on the client - branching on it
  // directly during render produced a real Mic/MicOff hydration mismatch
  // (different icon + disabled/aria-pressed attrs between server and client
  // HTML), which made React discard and rebuild this whole editor subtree
  // on the client. That remount is the most likely cause of Editor X
  // appearing to "forget" what was just typed. Fix: render the SSR-safe
  // disabled branch on the first client render too (matching the server
  // exactly), and only switch to the real capability after mount, via a
  // plain post-hydration state update instead of a hydration mismatch.
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(SUPPORT_SPEECH_RECOGNITION);
  }, []);

  if (supported) {
    return <SpeechToTextButton />;
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground"
      title={t.speechToText}
      aria-label={t.speechToText}
      disabled
    >
      <MicOff />
    </Button>
  );
}

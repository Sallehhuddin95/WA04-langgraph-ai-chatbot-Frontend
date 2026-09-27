"use client";

import * as React from "react";
import {
  DEFAULT_CHAT_MODEL,
  loadChatModel,
  saveChatModel,
} from "@/features/chat/services/chat-model";
import type { ChatModel } from "@/features/chat/types/chat";

export function useChatModel(): {
  model: ChatModel;
  setModel: (model: ChatModel) => void;
} {
  const [model, setModelState] = React.useState<ChatModel>(() => DEFAULT_CHAT_MODEL);

  React.useEffect(() => {
    setModelState(loadChatModel());
  }, []);

  const setModel = React.useCallback((next: ChatModel) => {
    setModelState(next);
    saveChatModel(next);
  }, []);

  return { model, setModel };
}

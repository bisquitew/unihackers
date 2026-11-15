import React from 'react';

export interface Auth0ModalProps {
  visible: boolean;
  authUrl: string;
  onSuccess: (token: string, hint?: { name?: string; email?: string; picture?: string }) => void;
  onClose: () => void;
}

export function Auth0Modal(_props: Auth0ModalProps) {
  // On Web, authentication is handled via popup window (window.open)
  return null;
}

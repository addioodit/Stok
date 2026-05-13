import React from 'react';
import { ALL_LEGAL } from '../data/legal';
import { LegalView } from '../components/LegalView';
import { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Legal'>;

export function LegalScreen({ route }: Props) {
  const doc = ALL_LEGAL[route.params.doc];
  return <LegalView doc={doc} />;
}

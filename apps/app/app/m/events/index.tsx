import React, { useState } from 'react';
import { View } from 'react-native';
import { EventsScreen } from '../../../src/modules/m01-events/EventsScreen';
import { BuddyModal } from '../../../src/modules/m07-buddy/BuddyModal';

export default function EventsRoute() {
  const [buddyModal, setBuddyModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
  }>({
    visible: false,
    eventId: '',
    eventTitle: '',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <EventsScreen
        onSelectBuddyForEvent={(eventId, eventTitle) =>
          setBuddyModal({ visible: true, eventId, eventTitle })
        }
      />
      <BuddyModal
        visible={buddyModal.visible}
        eventId={buddyModal.eventId}
        eventTitle={buddyModal.eventTitle}
        onClose={() => setBuddyModal({ ...buddyModal, visible: false })}
      />
    </View>
  );
}

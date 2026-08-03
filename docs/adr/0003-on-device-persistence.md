# Progress lives on-device only

Learning progress (SM-2 state, quiz stats, settings) is stored in AsyncStorage on the phone. No backend, no accounts, fully offline. The accepted trade-off: deleting the app loses progress and there is no cross-device sync. Revisit only if multi-device use becomes real.

import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Image, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { useEffect, useState, useRef } from 'react';
import { Video, ResizeMode, Audio } from 'expo-av';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Permettre audio même si switch silencieux (iOS)
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  const handlePlaybackStatusUpdate = (status: any) => {
    setVideoStatus(status);
    
    // Si la vidéo se termine, lancer la transition douce
    if (status.didJustFinish) {
      startTransition();
    }
  };

  const startTransition = () => {
    // Animation de fondu sortant
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800, // 800ms pour une transition douce
      useNativeDriver: true,
    }).start(() => {
      // Une fois le fondu terminé, changer d'écran
      setShowSplash(false);
    });
  };

  if (showSplash || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f4b6e' }}>
        <Animated.View style={{ 
          opacity: fadeAnim,
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          <Video
            source={require('../assets/icon.mp4')}
            style={{ 
              width: '100%', 
              height: '100%',
            }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false} // Ne pas boucler
            useNativeControls={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </Animated.View>
      </View>
    );
  }

  return <Redirect href={user ? '/(tabs)/dashboard' : '/(auth)/connexion'} />;
}

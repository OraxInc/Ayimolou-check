import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  targetName: string;
  loading?: boolean;
}

export default function ReviewModal({ 
  visible, 
  onClose, 
  onSubmit, 
  targetName,
  loading = false
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(star)}
            style={styles.starTouch}
          >
            <FontAwesome 
              name={star <= rating ? "star" : "star-o"} 
              size={40} 
              color={star <= rating ? "#FFC700" : "#ccc"} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Votre avis</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Qu'avez-vous pensé de l'ayimolou de {targetName} ?</Text>
          
          {renderStars()}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Écrivez un petit commentaire (optionnel)..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={() => onSubmit(rating, comment)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>Envoyer l'avis</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  starTouch: {
    padding: 8,
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FFC700',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default {
  data: () => ({features: {invitations: false, passwordReset: false, googleRegistration: false}, featuresLoaded: false}),
  async created() {
    try {
      const response = await fetch((process.env.VUE_APP_API_BASE_URL || '/api') + '/auth/options');
      if (!response.ok) throw new Error('unavailable');
      this.features = await response.json();
    } catch (_) { /* Keep actions unavailable if the policy cannot be loaded. */ }
    finally { this.featuresLoaded = true; }
  }
};

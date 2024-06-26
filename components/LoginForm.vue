<template>
    <div class="d-flex text-center justify-center">
    <v-card class="ld-small-card">
        <v-card-title class="text-h5  text-center bg-primary">
            Log In
        </v-card-title>

        <v-form ref="loginForm" v-model="loginValid" @submit.prevent="loginSubmit">
            <v-card-text class="text-center">
                <v-row>
                    <v-col cols="12">
                        <v-alert v-if="alertMessage" type="success" dense closable>
                            {{ alertMessage }}
                        </v-alert>
                        <v-alert v-if="loginError" type="error" dense closable @input="loginError = false">
                            Email or password is incorrect
                        </v-alert>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <v-text-field v-model="loginEmail" :rules="emailRules" autocomplete="email" label="Email"
                            outlined required></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field @click:append-inner="showLoginPassword = !showLoginPassword"
                            :type="showLoginPassword ? 'text' : 'password'" v-model="loginPassword"
                            :rules="passwordRules" autocomplete="current-password"
                            :append-inner-icon="showLoginPassword ? 'mdi-eye-off' : 'mdi-eye'" required label="Password"
                            outlined></v-text-field>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-center flex-column">
                <v-btn :loading="sendingRequest" class="ld-hvr-shrink pl-5 pr-5 bg-primary mb-2" size="x-large" rounded type="submit">
                    Login
                </v-btn>
                <NuxtLink to="/recovery/new" class="ld-hvr-shrink my-2 text-decoration-underline" size="x-large">
                    Forgot Password?
                </NuxtLink>
            </v-card-actions>
            <div class="d-flex py-3 justify-space-between align-center">
                <v-divider class="ml-8"></v-divider>
                <span class="pr-2 pl-2">OR</span>
                <v-divider class="mr-8"></v-divider>
            </div>
            <v-card-actions class="justify-center flex-column mb-2">
                <GoogleLoginButton />
            </v-card-actions>
        </v-form>
    </v-card>
    </div>
</template>

<script setup lang="ts">

import { VForm } from "vuetify/components"
import userService from '../services/userService';

defineProps({
    alertMessage: String,
})

const router = useRouter();
const loginError = ref(false);
const loginValid = ref(false);
const loginEmail = ref('');
const loginPassword = ref('');
const showLoginPassword = ref(false);
const loginForm: Ref<InstanceType<typeof VForm> | null> = ref(null);
const sendingRequest = ref(false);

const emailRules = [
    (v: string) => !!v || "E-mail is required",
    (v: string) => /.+@.+\..+/.test(v) || "E-mail must be valid",
];

const passwordRules = [
    (v: string) => !!v || "Password is required",
    (v: string) => v.length >= 8 || "Password must be at least 8 characters",
];

const loginSubmit = async () => {
    sendingRequest.value = true;

    const isValid = await loginForm.value?.validate();
    if (!(isValid?.valid)) { sendingRequest.value = false; return; }

    const response = await userService.loginUser(loginEmail.value, loginPassword.value);
    sendingRequest.value = false;
    if (!response) { loginError.value = true; }
    else {
        router.push({ path: '/' });
    }
};
</script>

<style></style>
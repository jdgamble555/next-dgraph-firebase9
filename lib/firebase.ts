import { getApp, initializeApp } from "firebase/app";
import { getAuth, getIdToken, GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut } from "firebase/auth";
import type { User } from 'firebase/auth';
import { getFunctions } from "firebase/functions";
import { useEffect, useState } from "react";

const firebaseConfig = {
    "apiKey": process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
    "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    "storageBucket": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "appId": process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    "measurementId": process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT
};

// load firebase app only once
const firebaseApp = () => {
    try {
        return getApp();
    } catch {
        return initializeApp(firebaseConfig);
    }
};

export const functions = getFunctions(firebaseApp());

const auth = getAuth(firebaseApp());

export const loginWithGoogle = async () => await signInWithPopup(auth, new GoogleAuthProvider());
export const logout = async () => await signOut(auth);

export const getToken = async () => new Promise<User>((res: any, rej: any) => onIdTokenChanged(auth, res, rej))
    .then(async (user: User) => user ? await getIdToken(user) : null);

// user hook
export function useUser() {
    const _auth = auth;
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        const unsubscribe = onIdTokenChanged(_auth, (iuser) => {
            setUser(iuser);
            iuser
                ? getIdToken(iuser).then((t: string) => setToken(t))
                : setToken(null);
        });
        return () => {
            unsubscribe();
        };
    }, [_auth]);
    return { user, token };
}
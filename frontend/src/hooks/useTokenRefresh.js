import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../firebase';
import { setUser, clearUser } from '../store/userSlice';

export const useTokenRefresh = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.user.currentUser);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = auth.onIdTokenChanged(async (user) => {
            if (user) {
                const token = await user.getIdToken();
                dispatch(setUser({
                    user: currentUser,
                    token
                }));
            } else {
                dispatch(clearUser());
            }
        });

        // Refresh token every 30 minutes
        const intervalId = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken(true);
                dispatch(setUser({
                    user: currentUser,
                    token
                }));
            }
        }, 30 * 60 * 1000);

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [currentUser, dispatch]);
}; 
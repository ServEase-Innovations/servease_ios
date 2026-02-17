/* eslint-disable */
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'recharts/types/state/store';


export const useAppDispatch = () => useDispatch<AppDispatch>();
/* eslint-disable */
import { useSelector } from 'react-redux';
import { RootState } from '../store/userStore';

export const useAppSelector = useSelector<RootState>;
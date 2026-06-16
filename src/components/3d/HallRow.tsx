import HallUnit from './HallUnit';
import { useTheaterStore } from '@/stores/useTheaterStore';

export default function HallRow() {
  const halls = useTheaterStore((s) => s.halls);

  return (
    <group name="hall-row">
      {halls.map((hall, index) => (
        <HallUnit key={hall.id} hall={hall} index={index} />
      ))}
    </group>
  );
}

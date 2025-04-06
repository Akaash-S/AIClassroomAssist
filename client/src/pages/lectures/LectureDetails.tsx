import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import AudioPlayer from "@/components/player/AudioPlayer";

interface LectureDetailsProps {
  id: number;
}

const LectureDetails = ({ id }: LectureDetailsProps) => {
  const { user } = useAuth();
  
  const { data: lecture, isLoading, error } = useQuery({
    queryKey: [`/api/lectures/${id}`],
    enabled: !!id,
  });
  
  if (isLoading) {
    return <div className="text-center py-10">Loading lecture details...</div>;
  }
  
  if (error || !lecture) {
    return (
      <div className="text-center py-10">
        <h2 className="text-lg font-medium text-red-600">Failed to load lecture</h2>
        <p className="mt-2 text-gray-500">
          The lecture you're looking for might have been removed or doesn't exist.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <AudioPlayer
        audioUrl={lecture.audioUrl}
        audioContent={lecture.audioContent}
        audioType={lecture.audioType}
        title={lecture.title}
        transcript={lecture.transcriptContent ? [{ time: 0, text: lecture.transcriptContent }] : undefined}
        summary={lecture.summary}
      />
    </div>
  );
};

export default LectureDetails;

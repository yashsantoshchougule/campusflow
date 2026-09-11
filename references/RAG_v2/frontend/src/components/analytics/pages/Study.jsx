import ContinueLearning from "../widgets/ContinueLearning";
import ReadingProgress from "../widgets/ReadingProgress";
import RecentBooks from "../widgets/RecentBooks";
import ReadingStats from "../widgets/ReadingStats";

function Study({ dashboard }) {

    const { study } = dashboard;

    return (

        <div className="space-y-8">

            <div className="grid lg:grid-cols-2 gap-6">

                <ContinueLearning study={study} />

                <ReadingProgress study={study} />

            </div>

            <div className="grid lg:grid-cols-2 gap-6">

                <RecentBooks study={study} />

                <ReadingStats study={study} />

            </div>

        </div>

    );

}

export default Study;
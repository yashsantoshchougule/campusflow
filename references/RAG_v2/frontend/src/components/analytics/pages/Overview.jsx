import KPICards from "../widgets/KPICards";
import WeeklyActivity from "../widgets/WeeklyActivity";
import ContinueLearning from "../widgets/ContinueLearning";
import RecentActivity from "../widgets/RecentActivity";
import AIInsights from "../widgets/AIInsights";

function Overview({ dashboard }) {

    const {
        overview,
        study,
        activity,
        weekly_progress,
    } = dashboard;

    return (
        <div className="space-y-8">

            <KPICards overview={overview} />

            <div className="grid lg:grid-cols-2 gap-6">

                <WeeklyActivity weekly={weekly_progress} />

                <ContinueLearning study={study} />

            </div>

            <div className="grid lg:grid-cols-2 gap-6">

                <RecentActivity activity={activity} />

                <AIInsights dashboard={dashboard} />

            </div>

        </div>
    );
}

export default Overview;
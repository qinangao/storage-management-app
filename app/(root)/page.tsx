import ActionDropdown from "@/components/ActionDropdown";
import Chart from "@/components/Chart";
import FormattedDateTime from "@/components/FormattedDateTime";
import Thumbnail from "@/components/Thumbnail";
import { getFiles } from "@/lib/actions/file.action";
import Link from "next/link";
import { Models } from "node-appwrite";

export default async function Dashborad() {
  const files = await getFiles({ types: [], limit: 10 });

  return (
    <div className="dashboard-container">
      <section>
        <Chart />
        <ul className="dashboard-summary-list"></ul>
      </section>

      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
        {files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {files.documents.map((file: Models.Document) => (
              <div
                className="flex w-full items-center justify-between gap-4"
                key={file.$id}
              >
                <Link
                  href={file.url}
                  target="_blank"
                  className="flex min-w-0 grow items-center gap-3"
                >
                  <Thumbnail
                    type={file.type}
                    extension={file.extension}
                    url={file.url}
                  />

                  <div className="flex min-w-0 flex-col">
                    <p className="recent-file-name truncate">{file.name}</p>
                    <FormattedDateTime
                      date={file.$createdAt}
                      className="caption truncate"
                    />
                  </div>
                </Link>

                <ActionDropdown file={file} />
              </div>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No files found</p>
        )}
      </section>
    </div>
  );
}

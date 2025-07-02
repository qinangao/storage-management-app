import { Models } from "node-appwrite";

function Card({ file }: { file: Models.Document }) {
  return <div>{file.name}</div>;
}

export default Card;

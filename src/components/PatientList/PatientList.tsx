import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: { use: string; family: string; given: string[] }[];
  gender: string;
  birthDate: string;
}

interface Props {
  patients: Patient[];
}

function PatientList({ patients }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Date of birth</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>
              {patient.name[0].given[0]} {patient.name[0].family}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{patient.gender}</Badge>
            </TableCell>
            <TableCell>{patient.birthDate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default PatientList;

"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

export default function RecentMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const data = await memberService.getAll();

      const latest = [...data]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      setMembers(latest);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "ACTIVE":
        return "success";

      case "INACTIVE":
        return "warning";

      case "SUSPENDED":
        return "error";

      default:
        return "default";
    }
  }

  function stageColor(stage: string) {
    switch (stage) {
      case "ACTIVE":
        return "success";

      case "APPROVED":
        return "primary";

      case "REJECTED":
        return "error";

      default:
        return "warning";
    }
  }

  return (
    <Card>
      <CardContent>

        <Typography
          variant="h5"
          mb={3}
        >
          Recent Members
        </Typography>

        {loading ? (
          <Box
            py={6}
            display="flex"
            justifyContent="center"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Table>

            <TableHead>

              <TableRow>

                <TableCell>
                  Membership No
                </TableCell>

                <TableCell>
                  Member
                </TableCell>

                <TableCell>
                  Category
                </TableCell>

                <TableCell>
                  Status
                </TableCell>

                <TableCell>
                  Registration Stage
                </TableCell>

                <TableCell>
                  Created
                </TableCell>

                <TableCell align="right">
                  Action
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {members.map((member) => (

                <TableRow
                  key={member.id}
                  hover
                >
                  <TableCell>
                    {member.membership_number}
                  </TableCell>

                  <TableCell>
                    {member.first_name}{" "}
                    {member.other_names}
                  </TableCell>

                  <TableCell>
                    {member.category?.name ??
                      "-"}
                  </TableCell>

                  <TableCell>

                    <Chip
                      size="small"
                      label={member.status}
                      color={statusColor(
                        member.status
                      )}
                    />

                  </TableCell>

                  <TableCell>

                    <Chip
                      size="small"
                      label={
                        member.registration_stage
                      }
                      color={stageColor(
                        member.registration_stage
                      )}
                    />

                  </TableCell>

                  <TableCell>
                    {new Date(
                      member.created_at
                    ).toLocaleDateString()}
                  </TableCell>

                  <TableCell align="right">

                    <Button
                      component={Link}
                      href={`/members/${member.id}`}
                      startIcon={
                        <VisibilityIcon />
                      }
                      size="small"
                    >
                      View
                    </Button>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>
        )}

      </CardContent>
    </Card>
  );
}